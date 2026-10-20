'use client'

import { useState } from 'react'
import { Alert, Button, Card, Col, Descriptions, Empty, InputNumber, Progress, Row, Select, Slider, Space, Spin, Switch, Tag, TimePicker, Upload } from 'antd'
import { CloseOutlined, InboxOutlined, PictureOutlined, UploadOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { detectImage } from '@/lib/detect'
import { useCameraMonitor } from '@/components/CameraMonitorProvider'
import { colorOf } from '@/lib/utils'
import notify from '@/lib/notify'
import ResultImage from '@/components/ResultImage'

const patrolMarks = { 5: '5分', 10: '10分', 20: '20分', 30: '30分', 40: '40分', 50: '50分', 60: '60分' }
const alarmOptions = [1, 3, 5, 10, 20, 30].map((v) => ({ value: v, label: `${v} 秒` }))

export default function DetectPanel() {
  const [conf, setConf] = useState(0.25); const [loading, setLoading] = useState(false); const [activeIdx, setActiveIdx] = useState(-1)
  const [slider, setSlider] = useState(10); const [customInterval, setCustomInterval] = useState(null); const [customUnit, setCustomUnit] = useState('minute')
  const [alarmInterval, setAlarmInterval] = useState(3); const [alarmRange, setAlarmRange] = useState(['22:00', '08:00'])
  const { cameraState, patrolOn, alarmOn, alarmMode, latest, setLatest, bindVideo, startPatrol, stopPatrol, startAlarm, stopAlarm } = useCameraMonitor()
  const result = latest?.data; const objects = result?.detect?.objects || []
  const patrolSettings = () => ({ slider, customInterval, customUnit, conf })
  const alarmSettings = () => ({ interval: alarmInterval, range: alarmRange, conf })
  async function onUpload(file) {
    setLoading(true); setActiveIdx(-1)
    try { const data = await detectImage(file, { conf }); setLatest({ data, source: '手动上传' }); notify.success(`检测完成，共识别 ${data.detect.count} 个目标`) } finally { setLoading(false) }
  }
  return <div className="detect-page">
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}><Card className="panel-card control-card" title={<span className="card-title"><UploadOutlined /> 手动上传图像</span>}>
        <Upload.Dragger name="file" accept="image/*" showUploadList={false} disabled={loading} beforeUpload={(f) => f.type.startsWith('image/') ? true : Upload.LIST_IGNORE} customRequest={({ file }) => onUpload(file)}><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">拖拽图片或点击选择</p><p className="ant-upload-hint">jpg / png，在本地检测与保存</p></Upload.Dragger>
        <div className="conf-row"><div className="conf-label">置信度 <Tag>{Math.round(conf * 100)}%</Tag></div><Slider min={0.05} max={0.95} step={0.05} value={conf} onChange={setConf} /></div>
      </Card></Col>
      <Col xs={24} lg={8}><Card className="panel-card control-card" title={<span className="card-title"><VideoCameraOutlined /> 智能环境监控</span>} extra={<Switch checked={patrolOn} onChange={(on) => on ? startPatrol(patrolSettings()) : stopPatrol()} checkedChildren="开启" unCheckedChildren="关闭" />}>
        <p className="camera-hint">开启后将连接摄像头；并定时反馈环境状态。</p><div className="setting-label">滑块频率（分钟）</div><Slider marks={patrolMarks} min={5} max={60} step={null} value={slider} onChange={(v) => { setSlider(v); setCustomInterval(null); if (patrolOn) startPatrol({ ...patrolSettings(), slider: v, customInterval: null }) }} />
        <div className="setting-label">或自定义频率</div><Space.Compact block><InputNumber min={customUnit === 'hour' ? 1 : 5} max={customUnit === 'hour' ? 24 : 1440} value={customInterval} onChange={(v) => { setCustomInterval(v); if (patrolOn && v) startPatrol({ ...patrolSettings(), customInterval: v }) }} placeholder="使用滑块" style={{ width: '65%' }} /><Select value={customUnit} onChange={(v) => { setCustomUnit(v); if (patrolOn) startPatrol({ ...patrolSettings(), customUnit: v }) }} options={[{ value: 'minute', label: '分钟' }, { value: 'hour', label: '小时' }]} style={{ width: '35%' }} /></Space.Compact><div className="camera-state"><Tag color={patrolOn || alarmOn ? 'processing' : 'default'}>{cameraState}</Tag></div>
      </Card></Col>
      <Col xs={24} lg={8}><Card className="panel-card control-card" title={<span className="card-title"><VideoCameraOutlined /> 人员检测时段</span>} extra={<Switch checked={alarmOn} onChange={(on) => on ? startAlarm(alarmSettings()) : stopAlarm()} checkedChildren="开启" unCheckedChildren="关闭" />}>
        <div className="setting-label">告警时段（支持跨天）</div><TimePicker.RangePicker format="HH:mm" value={null} placeholder={alarmRange} onChange={(v, strings) => { if (v) { setAlarmRange(strings); if (alarmOn) startAlarm({ ...alarmSettings(), range: strings }) } }} style={{ width: '100%' }} /><div className="setting-label">发现人员后的留证频率</div><Select value={alarmInterval} onChange={(v) => { setAlarmInterval(v); if (alarmOn) startAlarm({ ...alarmSettings(), interval: v }) }} options={alarmOptions} style={{ width: '100%' }} /><Alert className="alarm-status" type={alarmOn ? 'info' : 'warning'} showIcon message={alarmMode} description="常规探测每分钟一次；无人画面不会保存。高频阶段连续 10 次无人后自动恢复常规探测。" />
      </Card></Col>
    </Row>
    <Row gutter={[16, 16]} className="monitor-result-row">
      <Col xs={24} lg={12}><Card className="panel-card result-card media-card" title={<span className="card-title"><VideoCameraOutlined /> 实时监控画面</span>}><video ref={bindVideo} muted playsInline autoPlay className="camera-live" />{!patrolOn && !alarmOn ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="开启任一摄像头服务后显示实时画面" /> : null}</Card></Col>
      <Col xs={24} lg={12}><Card className="panel-card result-card media-card" title={<span className="card-title"><PictureOutlined /> 最新检测结果</span>} extra={result ? <Button type="primary" danger ghost size="small" onClick={() => { setLatest(null); setActiveIdx(-1) }}><CloseOutlined /> 清除</Button> : null}>
        {!result && !loading ? <Empty description="上传图片或自动服务识别到人员后，结果将显示在这里" style={{ padding: '38px 0' }} /> : null}<Spin spinning={loading} tip="模型推理中…"><div className="result-box">{result && <><div className="result-source"><Tag color="blue">{latest.source}</Tag>{result.agentAction && <Tag color="green">{result.agentAction}</Tag>}</div><ResultImage imageUrl={result.imageUrl} objects={objects} width={result.detect.image_width} height={result.detect.image_height} activeIndex={activeIdx} /><Descriptions className="result-meta" column={3} bordered size="small" items={[{ label: '记录 ID', children: result.recordId }, { label: '模型', children: result.detect.model }, { label: '目标数', children: result.detect.count }]} /><div className="obj-title">目标明细（点击一行可高亮对应框）</div><div style={{ maxHeight: 220, overflow: 'auto' }}>{objects.map((o, i) => <div key={i} className={`obj-row${activeIdx === i ? ' active' : ''}`} onClick={() => setActiveIdx((v) => v === i ? -1 : i)}><span className="obj-color" style={{ backgroundColor: colorOf(o.cls_idx) }} /><span className="obj-name">{o.cls_name}</span><Progress className="obj-bar" percent={Math.round(o.conf * 100)} strokeColor={colorOf(o.cls_idx)} size="small" showInfo={false} /><span className="obj-conf">{(o.conf * 100).toFixed(1)}%</span></div>)}</div></>}</div></Spin>
      </Card></Col>
    </Row>
  </div>
}
