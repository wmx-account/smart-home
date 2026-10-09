import './globals.css'
import Providers from './providers'
import Shell from '@/components/Shell'

export const metadata = {
  title: '智能家居边缘智能系统',
  description: 'YOLO 目标检测 · 设备实时监控 · SpringBoot + FastAPI + Next.js(React)',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
