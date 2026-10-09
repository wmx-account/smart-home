'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
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

export default function Providers({ children }) {
  return (
    <AntdRegistry>
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
    </AntdRegistry>
  )
}
