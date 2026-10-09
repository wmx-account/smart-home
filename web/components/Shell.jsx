'use client'

import { Menu } from 'antd'
import {
  HomeOutlined,
  ScanOutlined,
  DashboardOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getHealth } from '@/lib/detect'

export default function Shell({ children }) {
  const pathname = usePathname()
  const [serverOnline, setServerOnline] = useState(false)
  const [aiOnline, setAiOnline] = useState(false)

  // 轮询健康检查，在顶部实时显示两个后端服务的在线状态
  useEffect(() => {
    let timer
    async function ping() {
      try {
        const d = await getHealth()
        setServerOnline(d.status === 'running')
        setAiOnline(d.aiPlatform?.status === 'running')
      } catch {
        setServerOnline(false)
        setAiOnline(false)
      }
    }
    ping()
    timer = setInterval(ping, 15000)
    return () => clearInterval(timer)
  }, [])

  const items = [
    {
      key: '/',
      label: (
        <Link href="/" className="nav-link">
          <ScanOutlined />
          <span>目标检测</span>
        </Link>
      ),
    },
    {
      key: '/device',
      label: (
        <Link href="/device" className="nav-link">
          <DashboardOutlined />
          <span>设备监控</span>
        </Link>
      ),
    },
    {
      key: '/records',
      label: (
        <Link href="/records" className="nav-link">
          <HistoryOutlined />
          <span>检测历史</span>
        </Link>
      ),
    },
  ]

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon">
            <HomeOutlined />
          </span>
          <div className="brand-text">
            <h1>智能家居边缘智能系统</h1>
            <p>YOLO 目标检测 · 设备实时监控 · SpringBoot + FastAPI + Next.js(React)</p>
          </div>
        </div>
        <div className="status">
          <div className={`status-item${serverOnline ? ' on' : ''}`}>
            <span className="dot" />
            业务服务 8080<span className="state">{serverOnline ? '在线' : '离线'}</span>
          </div>
          <div className={`status-item${aiOnline ? ' on' : ''}`}>
            <span className="dot" />
            AI 推理 8000<span className="state">{aiOnline ? '在线' : '离线'}</span>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <Menu mode="horizontal" selectedKeys={[pathname]} items={items} className="nav-menu" />
      </nav>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        AI 辅助开发实践项目 · Next.js(React) 静态导出 + Nginx 部署 · 检测图片与记录仅保存在本机
        MySQL 与 uploads 目录
      </footer>
    </div>
  )
}
