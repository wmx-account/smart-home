// axios 实例：统一的请求出口。类比 Java 端的 RestClientConfig + GlobalExceptionHandler，
// 在这里集中处理后端统一响应体 {code,msg,data} 和网络错误。
import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  timeout: 60000, // 首次推理要加载模型，给足超时
})

// 响应拦截器：所有请求返回后先经过这里
service.interceptors.response.use(
  (response) => {
    const body = response.data
    // 后端统一包装 {code,msg,data}：code=0 成功，直接把 data 交给业务代码
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data
      }
      ElMessage.error(body.msg || '请求失败')
      return Promise.reject(new Error(body.msg || '业务错误'))
    }
    return body
  },
  (error) => {
    // HTTP 层错误（404/503/500、服务没启动等）
    const msg = error.response?.data?.msg || error.message || '网络异常，请确认后端服务已启动'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

export default service
