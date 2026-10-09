'use client'

import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect } from 'react'
import { bindMessage } from '@/lib/notify'

// 把 antd 的 message 实例注入消息桥，供组件外（axios 拦截器）使用
function MessageBinder() {
  const { message } = AntApp.useApp()
  useEffect(() => {
    bindMessage(message)
  }, [message])
  return null
}

// 仅放需要在客户端运行的上下文（主题、语言、message）。
// antd 组件样式在构建前由 scripts/genAntdCss.cjs 烘焙成静态 CSS（layout.jsx 引入），
// 不再依赖运行时 cssinjs 注入，避免静态导出首屏样式闪烁（FOUC）。
export default function Providers({ children }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0e6b7a',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <MessageBinder />
        {children}
      </AntApp>
    </ConfigProvider>
  )
}
