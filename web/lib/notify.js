// 全局消息桥：axios 拦截器在 React 组件之外运行，拿不到 antd 的上下文，
// 由 Providers 挂载时把 antd 的 message 实例注入进来，统一走主题/上下文。
const noop = () => {}

let holder = { success: noop, error: noop, warning: noop, info: noop }

export function bindMessage(messageApi) {
  holder = messageApi
}

const notify = {
  success: (...args) => holder.success(...args),
  error: (...args) => holder.error(...args),
  warning: (...args) => holder.warning(...args),
  info: (...args) => holder.info(...args),
}

export default notify
