'use client'

import { useMemo } from 'react'
import { Row, Col } from 'antd'
import EChart from '@/components/EChart'
import { gaugeOption } from '@/lib/chartOptions'

// 三个实时仪表盘：温 / 湿 / 光照。gaugeOption 内的 center、offsetCenter
// 已固定为“仪表弧在上、数值居中、标题在最下”的三层分离布局，避免文字与图重合。
export default function GaugeGrid({ snap }) {
  const temperature = snap?.temperature
  const humidity = snap?.humidity
  const light = snap?.light

  const tempOption = useMemo(
    () => gaugeOption(temperature, '温度', '℃', 10, 40, '#f56c6c', 1),
    [temperature],
  )
  const humOption = useMemo(
    () => gaugeOption(humidity, '湿度', '%', 0, 100, '#409eff', 1),
    [humidity],
  )
  const lightOption = useMemo(
    () => gaugeOption(light, '光照', 'lx', 0, 1000, '#e6a23c', 0),
    [light],
  )

  return (
    <Row gutter={16}>
      <Col xs={24} sm={8}>
        <EChart className="chart" option={tempOption} />
      </Col>
      <Col xs={24} sm={8}>
        <EChart className="chart" option={humOption} />
      </Col>
      <Col xs={24} sm={8}>
        <EChart className="chart" option={lightOption} />
      </Col>
    </Row>
  )
}
