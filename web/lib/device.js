// 设备相关接口封装（阶段6a/6b）
import request from '@/lib/request'

// 查询当前设备遥测快照：页面首次加载时立即拿到一帧，不必干等 SSE
export function getDeviceStatus() {
  return request.get('/api/device/status')
}

// 风扇控制（上行指令走 REST，一问一答、可校验、可重试、后端落 fan_control_log）
// power：true 开 / false 关；speed：0 关 / 1 半速 / 2 全速
export function controlFan(power, speed) {
  return request.post('/api/device/fan', { power, speed })
}

// SSE 遥测流地址：交给浏览器原生 EventSource（不走 axios）；
// 开发期由 Next rewrites、生产由 Nginx 反代到 8080
export const DEVICE_STREAM_URL = '/api/device/stream'

// 历史趋势：按 range（1h/1d/7d/30d）返回时间桶聚合点
export function getSensorData(range) {
  return request.get('/api/device/sensor', { params: { range } })
}

// 风扇操作历史分页
export function getFanLogs(pageNum = 1, pageSize = 8) {
  return request.get('/api/device/fan-logs', { params: { pageNum, pageSize } })
}
