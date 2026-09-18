// 检测相关接口封装：组件只调用这里的函数，不直接写 URL
import request from './request'

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

// 检测历史分页
export function getRecords(pageNum = 1, pageSize = 8) {
  return request.get('/api/records', { params: { pageNum, pageSize } })
}

// 检测详情（含完整 resultJson）
export function getRecordDetail(id) {
  return request.get(`/api/records/${id}`)
}
