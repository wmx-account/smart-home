'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

// 通用 ECharts 封装：挂载时初始化、option 变化时更新；
// 内置 ResizeObserver + 窗口 resize 自适应，卸载时 dispose，杜绝泄漏。
export default function EChart({ option, className, notMerge = false }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const chart = echarts.init(containerRef.current)
    chartRef.current = chart

    const resize = () => chart.resize()
    const ro = new ResizeObserver(resize)
    ro.observe(containerRef.current)
    window.addEventListener('resize', resize)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, notMerge)
    }
  }, [option, notMerge])

  return <div ref={containerRef} className={className} />
}
