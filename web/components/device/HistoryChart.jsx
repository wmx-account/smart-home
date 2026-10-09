'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, Radio } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import EChart from '@/components/EChart'
import { getSensorData } from '@/lib/device'
import { lineOption } from '@/lib/chartOptions'

const RANGE_OPTIONS = [
  { label: '近1小时', value: '1h' },
  { label: '近1天', value: '1d' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
]

// 历史趋势：温湿度左轴、光照右轴，按时间范围切换，底部可缩放
export default function HistoryChart() {
  const [range, setRange] = useState('1h')
  const [points, setPoints] = useState([])

  useEffect(() => {
    let alive = true
    getSensorData(range)
      .then((list) => {
        if (alive) setPoints(list || [])
      })
      .catch(() => {
        // 历史加载失败不影响实时监控
      })
    return () => {
      alive = false
    }
  }, [range])

  const option = useMemo(() => lineOption(points), [points])

  return (
    <Card
      className="panel-card"
      title={
        <span className="card-title">
          <LineChartOutlined /> 历史趋势
        </span>
      }
      extra={
        <Radio.Group
          size="small"
          optionType="button"
          buttonStyle="solid"
          value={range}
          options={RANGE_OPTIONS}
          onChange={(e) => setRange(e.target.value)}
        />
      }
    >
      <EChart className="hist-chart" option={option} notMerge />
    </Card>
  )
}
