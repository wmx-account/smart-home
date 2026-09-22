// 设备相关接口封装（阶段6a）
import request from './request'

// 查询当前设备遥测快照：页面首次加载时立即拿到一帧，不必干等 SSE
export function getDeviceStatus() {
  return request.get('/api/device/status')
}

// 风扇控制（上行指令走 REST，一问一答、可校验、可重试、后端落 fan_control_log）
// power：true 开 / false 关；speed：0 关 / 1 半速 / 2 全速
export function controlFan(power, speed) {
  return request.post('/api/device/fan', { power, speed })
}

// SSE 遥测流地址：交给浏览器原生 EventSource（不走 axios），由 Vite 代理到 8080
export const DEVICE_STREAM_URL = '/api/device/stream'
