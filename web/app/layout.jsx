// antd 静态样式（构建前由 scripts/genAntdCss.cjs 烘焙生成），必须在 globals.css 之前引入，
// 以便项目自有样式覆盖 antd 默认值。解决 Next.js 静态导出首屏 antd 无样式闪烁(FOUC)。
import './antd.min.css'
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
