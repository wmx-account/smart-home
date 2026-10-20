'use client'

import { Badge } from 'antd'
import { DashboardOutlined, HistoryOutlined, HomeOutlined, ScanOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { getHealth } from '@/lib/detect'

const pages = {
  '/': { title: '环境监控中心', description: '摄像头监控、智能巡检与人形告警', icon: ScanOutlined },
  '/device': { title: '设备控制台', description: '查看实时环境，管理家居设备', icon: DashboardOutlined },
  '/records': { title: '检测记录', description: '回溯已保存的图像与识别结果', icon: HistoryOutlined },
}

export default function Shell({ children }) {
  const pathname = usePathname()
  const [serverOnline, setServerOnline] = useState(false)
  const [aiOnline, setAiOnline] = useState(false)
  const page = useMemo(() => pages[pathname] || pages['/'], [pathname])
  const PageIcon = page.icon

  useEffect(() => {
    let timer
    const ping = async () => {
      try {
        const data = await getHealth()
        setServerOnline(data.status === 'running')
        setAiOnline(data.aiPlatform?.status === 'running')
      } catch { setServerOnline(false); setAiOnline(false) }
    }
    ping(); timer = setInterval(ping, 15000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { href: '/', label: '环境监控', icon: ScanOutlined },
    { href: '/device', label: '设备监控', icon: DashboardOutlined },
    { href: '/records', label: '监控历史', icon: HistoryOutlined },
  ]

  return <div className="console-shell">
    <aside className="console-sidebar">
      <Link href="/" className="console-brand"><span className="brand-mark"><HomeOutlined /></span><span><strong>智能家居</strong><small>CONTROL CENTER</small></span></Link>
      <nav className="console-nav"><div className="nav-caption">工作台</div>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`console-nav-item${pathname === href ? ' active' : ''}`}><Icon /><span>{label}</span>{pathname === href && <i />}</Link>)}</nav>
      <div className="service-stack"><div className="service-label">系统状态</div><div className="service-line"><Badge status={serverOnline ? 'success' : 'error'} />业务服务 <span>{serverOnline ? '在线' : '离线'}</span></div><div className="service-line"><Badge status={aiOnline ? 'success' : 'error'} />AI 推理 <span>{aiOnline ? '在线' : '离线'}</span></div></div>
    </aside>
    <div className="console-content"><header className="console-topbar"><div className="page-heading"><span className="page-icon"><PageIcon /></span><div><h1>{page.title}</h1><p>{page.description}</p></div></div><div className="topbar-status"><span className="pulse" />系统运行中</div></header><main className="console-main">{children}</main></div>
  </div>
}
