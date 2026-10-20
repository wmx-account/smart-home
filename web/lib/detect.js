// 检测相关接口封装：组件只调用这里的函数，不直接写 URL
import request from '@/lib/request'

// 上传图片检测。multipart/form-data：用 FormData 装文件和普通字段，
// 等价于 curl -F "file=@xx.jpg" -F "conf=0.25"
export function detectImage(file, { modelName = 'yolo11n.pt', conf = 0.25 } = {}) {
  const form = new FormData()
  form.append('file', file)
  form.append('modelName', modelName)
  form.append('conf', conf)
  return request.post('/api/detect', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 摄像头帧检测：后端仅在识别到 person 时保存图片、写入记录并触发临时 Agent 规则。
export function detectCameraFrame(file, { source, conf = 0.25 } = {}) {
  const form = new FormData()
  form.append('file', file)
  form.append('conf', conf)
  form.append('source', source)
  return request.post('/api/camera/detect', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 检测历史分页
export function getRecords(pageNum = 1, pageSize = 8) {
  return request.get('/api/records', { params: { pageNum, pageSize } })
}

// 检测详情（含完整 resultJson）
export function getRecordDetail(id) {
  return request.get(`/api/records/${id}`)
}

// 服务健康状态（业务服务 + 下游 AI 服务探活）
export function getHealth() {
  return request.get('/api/health')
}
