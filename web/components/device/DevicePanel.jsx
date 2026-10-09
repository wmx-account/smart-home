'use client'

import { useEffect, useState } from 'react'
import { Card, Tag } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import { getDeviceStatus, controlFan, DEVICE_STREAM_URL } from '@/lib/device'
import { speedName, formatTs } from '@/lib/utils'
import notify from '@/lib/notify'
import GaugeGrid from './GaugeGrid'
import HistoryChart from './HistoryChart'
import FanControl from './FanControl'

// 设备监控页容器：负责 SSE 遥测订阅、快照状态与风扇控制，
// 展示拆分为 GaugeGrid / HistoryChart / FanControl 三个子组件。
export default function DevicePanel() {
  const [connState, setConnState] = useState('connecting') // connecting / online / closed
  const [snap, setSnap] = useState(null)
  const [sending, setSending] = useState(false)

  function applySnap(s) {
    setSnap(s)
  }

  // 控制失败后重新拉一次真实状态回滚 UI，避免界面与后端不一致
  function rollback() {
    getDeviceStatus()
      .then(applySnap)
      .catch(() => {})
  }

  async function onPowerChange(power) {
    setSending(true)
    try {
      const useSpeed = snap?.fanSpeed >= 1 ? snap.fanSpeed : 1
      const s = await controlFan(power, power ? useSpeed : 0)
      applySnap(s)
      notify.success(power ? `风扇已开启（${speedName(s.fanSpeed)}）` : '风扇已关闭')
    } catch {
      rollback()
    } finally {
      setSending(false)
    }
  }

  async function onSpeedChange(speed) {
    if (!snap?.fanPower) return
    setSending(true)
    try {
      const s = await controlFan(true, speed)
      applySnap(s)
      notify.success(`已切换为${speedName(speed)}`)
    } catch {
      rollback()
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    // 先拉一帧快照立即显示，再订阅 SSE 持续刷新
    getDeviceStatus()
      .then(applySnap)
      .catch(() => {})

    // 原生 EventSource，浏览器断线自动重连
    const es = new EventSource(DEVICE_STREAM_URL)
    es.addEventListener('open', () => setConnState('online'))
    es.addEventListener('telemetry', (e) => {
      setConnState('online')
      try {
        applySnap(JSON.parse(e.data))
      } catch {
        // 单帧解析失败不影响后续推送
      }
    })
    es.addEventListener('error', () => {
      setConnState(es.readyState === EventSource.CLOSED ? 'closed' : 'connecting')
    })

    return () => es.close()
  }, [])

  const fanPower = !!snap?.fanPower
  const fanSpeed = snap?.fanSpeed >= 1 ? snap.fanSpeed : 1

  return (
    <div className="device-page">
      <Card
        className="panel-card"
        title={
          <span className="card-title">
            <DashboardOutlined /> 设备实时监控
          </span>
        }
        extra={
          <div className="conn">
            <Tag color={connState === 'online' ? 'success' : 'warning'} bordered={false}>
              <span className={`dot ${connState}`} />
              {connState === 'online' ? 'SSE 已连接' : '重连中…'}
            </Tag>
            {snap ? (
              <Tag color="default" bordered={false}>
                更新于 {formatTs(snap.ts)}
              </Tag>
            ) : null}
          </div>
        }
      >
        <GaugeGrid snap={snap} />
        <div className="hint">
          温湿度 / 光照由后端每 2s 通过 SSE（text/event-stream）主动推送；当前为内置 Mock 设备
          （device.gateway.type=mock），将来替换为真实 STM32 网关时前端无需改动。
        </div>
      </Card>

      <HistoryChart />

      <FanControl
        fanPower={fanPower}
        fanSpeed={fanSpeed}
        sending={sending}
        onPowerChange={onPowerChange}
        onSpeedChange={onSpeedChange}
      />
    </div>
  )
}
