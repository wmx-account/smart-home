// 通用常量与格式化工具

// 目标类别配色（与 Python 检测端 / 原前端保持一致）
export const PALETTE = [
  '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

export function colorOf(idx) {
  return PALETTE[(idx ?? 0) % PALETTE.length]
}

export function num(v) {
  return v == null ? null : Number(v)
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

// 兼容后端 LocalDateTime 的两种序列化形式（ISO 字符串或数组）
export function fmtTime(t) {
  if (!t) return ''
  if (Array.isArray(t)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = t
    return `${y}-${pad2(m)}-${pad2(d)} ${pad2(h)}:${pad2(mi)}:${pad2(s)}`
  }
  return String(t).replace('T', ' ').substring(0, 19)
}

// 历史趋势图横轴：MM-DD HH:mm
export function formatChartTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// 风扇操作记录时间：MM-DD HH:mm:ss
export function formatLogTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

// SSE 快照更新时间（仅时分秒）
export function formatTs(ts) {
  return ts ? new Date(ts).toLocaleTimeString('zh-CN', { hour12: false }) : ''
}

export function speedName(speed) {
  return speed === 2 ? '全速' : speed === 1 ? '半速' : '关闭'
}

export function fanActionText(row) {
  return row.power === 1 ? `开启 · ${row.speed === 2 ? '全速' : '半速'}` : '关闭'
}
