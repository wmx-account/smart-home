'use client'

import { useState } from 'react'
import { Card, Switch, Radio, Divider, Tag, Button } from 'antd'
import { ThunderboltOutlined, HistoryOutlined } from '@ant-design/icons'
import { speedName } from '@/lib/utils'
import FanLogModal from './FanLogModal'

// 风扇控制（上行指令走 REST）：电源开关 + 半速 / 全速档位
export default function FanControl({
  fanPower,
  fanSpeed,
  sending,
  onPowerChange,
  onSpeedChange,
}) {
  const [logOpen, setLogOpen] = useState(false)

  return (
    <Card
      className="panel-card"
      title={
        <span className="card-title">
          <ThunderboltOutlined /> 风扇控制
        </span>
      }
      extra={
        <Button type="link" size="small" onClick={() => setLogOpen(true)}>
          <HistoryOutlined /> 操作记录
        </Button>
      }
    >
      <div className="fan-row">
        <span className="fan-label">电源</span>
        <Switch
          checked={fanPower}
          loading={sending}
          checkedChildren="开启"
          unCheckedChildren="关闭"
          onChange={onPowerChange}
        />
        <Divider type="vertical" />
        <span className="fan-label">档位</span>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          disabled={!fanPower || sending}
          value={fanSpeed}
          options={[
            { label: '半速', value: 1 },
            { label: '全速', value: 2 },
          ]}
          onChange={(e) => onSpeedChange(e.target.value)}
        />
        <Tag color={fanPower ? 'success' : 'default'} className="fan-state">
          {fanPower ? `运行中 · ${speedName(fanSpeed)}` : '已关闭'}
        </Tag>
      </div>
      <div className="hint">
        控制指令走 REST（POST /api/device/fan）并写入 fan_control_log 审计；开风扇后温度按档位下降
        （半速趋向约 22℃、全速约 18℃），关机回升到环境温约 26℃，形成联动闭环。
      </div>

      <FanLogModal open={logOpen} onClose={() => setLogOpen(false)} />
    </Card>
  )
}
