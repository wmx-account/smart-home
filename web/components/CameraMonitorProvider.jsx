'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { detectCameraFrame } from '@/lib/detect'
import notify from '@/lib/notify'

const CameraMonitorContext = createContext(null)

function inRange(start, end) {
  const n = new Date(); const now = n.getHours() * 60 + n.getMinutes()
  const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number)
  const from = sh * 60 + sm; const to = eh * 60 + em
  return from === to || (from < to ? now >= from && now < to : now >= from || now < to)
}

export function CameraMonitorProvider({ children }) {
  const [cameraState, setCameraState] = useState('未开启')
  const [patrolOn, setPatrolOn] = useState(false)
  const [alarmOn, setAlarmOn] = useState(false)
  const [alarmMode, setAlarmMode] = useState('已关闭')
  const [latest, setLatest] = useState(null)
  const streamRef = useRef(null); const videoRef = useRef(null); const processorRef = useRef(null); const patrolRef = useRef(null); const alarmRef = useRef(null)
  const busyRef = useRef(false); const patrolOnRef = useRef(false); const alarmOnRef = useRef(false); const alarmSettingsRef = useRef(null)
  const evidenceRef = useRef(false); const missesRef = useRef(0)

  const bindVideo = useCallback((node) => {
    videoRef.current = node
    if (node && streamRef.current) { node.srcObject = streamRef.current; node.play().catch(() => {}) }
  }, [])
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (processorRef.current) processorRef.current.srcObject = null
    setCameraState('已关闭')
  }, [])
  const ensureCamera = useCallback(async () => {
    if (streamRef.current) return true
    try {
      setCameraState('正在请求摄像头权限…')
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (processorRef.current) { processorRef.current.srcObject = stream; await processorRef.current.play() }
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraState('摄像头运行中')
      return true
    } catch (_) { setCameraState('摄像头不可用或权限被拒绝'); notify.error('无法打开摄像头，请授予浏览器摄像头权限'); return false }
  }, [])
  const capture = useCallback(async (source, conf) => {
    if (busyRef.current || !(await ensureCamera())) return null
    busyRef.current = true
    try {
      const video = processorRef.current
      if (!video?.videoWidth) return null
      const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) return null
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const data = await detectCameraFrame(file, { source, conf })
      if (data.persisted) {
        setLatest({ data, source: source === 'PATROL' ? '智能巡检' : '人形告警' })
        if (data.agentAction) notify.info(`Agent 规则：${data.agentAction}`)
      }
      return data
    } catch (_) { return null } finally { busyRef.current = false }
  }, [ensureCamera])
  const maybeRelease = useCallback(() => { if (!patrolOnRef.current && !alarmOnRef.current) stopCamera() }, [stopCamera])
  const stopPatrol = useCallback(() => { clearInterval(patrolRef.current); patrolOnRef.current = false; setPatrolOn(false); maybeRelease() }, [maybeRelease])
  const stopAlarm = useCallback(() => { clearTimeout(alarmRef.current); alarmOnRef.current = false; evidenceRef.current = false; missesRef.current = 0; setAlarmOn(false); setAlarmMode('已关闭'); maybeRelease() }, [maybeRelease])
  const startPatrol = useCallback((settings) => {
    clearInterval(patrolRef.current); patrolOnRef.current = true; setPatrolOn(true)
    const minutes = settings.customInterval ? settings.customInterval * (settings.customUnit === 'hour' ? 60 : 1) : settings.slider
    capture('PATROL', settings.conf); patrolRef.current = setInterval(() => capture('PATROL', settings.conf), minutes * 60_000)
  }, [capture])
  const startAlarm = useCallback((settings) => {
    clearTimeout(alarmRef.current); alarmSettingsRef.current = settings; alarmOnRef.current = true; setAlarmOn(true)
    const probe = async () => {
      const s = alarmSettingsRef.current
      if (!alarmOnRef.current) return
      if (!inRange(s.range[0], s.range[1])) { setAlarmMode('当前不在设定告警时段'); alarmRef.current = setTimeout(probe, 60_000); return }
      const data = await capture('ALARM', s.conf)
      if (data?.persisted) { evidenceRef.current = true; missesRef.current = 0; setAlarmMode(`已发现人员，${s.interval} 秒留证中`) }
      else if (evidenceRef.current && ++missesRef.current >= 10) { evidenceRef.current = false; missesRef.current = 0; setAlarmMode('连续 10 次无人，已恢复每分钟探测') }
      else if (evidenceRef.current) setAlarmMode(`留证中：连续无人 ${missesRef.current}/10 次`)
      else setAlarmMode('常规探测中（每分钟一次）')
      alarmRef.current = setTimeout(probe, evidenceRef.current ? s.interval * 1000 : 60_000)
    }
    probe()
  }, [capture])
  useEffect(() => () => { clearInterval(patrolRef.current); clearTimeout(alarmRef.current); stopCamera() }, [stopCamera])
  return <CameraMonitorContext.Provider value={{ cameraState, patrolOn, alarmOn, alarmMode, latest, setLatest, bindVideo, startPatrol, stopPatrol, startAlarm, stopAlarm }}><video ref={processorRef} muted playsInline className="camera-processor" />{children}</CameraMonitorContext.Provider>
}

export function useCameraMonitor() {
  const value = useContext(CameraMonitorContext)
  if (!value) throw new Error('useCameraMonitor 必须位于 CameraMonitorProvider 内')
  return value
}
