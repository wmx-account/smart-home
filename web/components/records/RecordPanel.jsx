'use client'

import { useEffect, useState } from 'react'
import { Card, Statistic, Button, Table, Image, Modal } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { getRecords, getRecordDetail } from '@/lib/detect'
import { fmtTime } from '@/lib/utils'
import ResultImage from '@/components/ResultImage'

const PAGE_SIZE = 8

export default function RecordPanel() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [loading, setLoading] = useState(false)
  const [pageObjects, setPageObjects] = useState(0)
  const [avgCost, setAvgCost] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailObjects, setDetailObjects] = useState([])

  async function load(page = 1) {
    setPageNum(page)
    setLoading(true)
    try {
      const data = await getRecords(page, PAGE_SIZE)
      setList(data.list)
      setTotal(data.total)
      setPageObjects(data.list.reduce((s, r) => s + (r.objectCount || 0), 0))
      const costs = data.list.map((r) => r.costMs || 0)
      setAvgCost(
        costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0,
      )
    } finally {
      setLoading(false)
    }
  }

  async function view(row) {
    const data = await getRecordDetail(row.id)
    setDetail(data)
    // 详情接口的 resultJson 是字符串，解析出 objects 给画框组件
    setDetailObjects(JSON.parse(data.resultJson || '{}').objects || [])
    setDialogOpen(true)
  }

  useEffect(() => {
    load(1)
  }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    {
      title: '缩略图',
      dataIndex: 'imagePath',
      width: 110,
      render: (src) => (
        <Image
          src={src}
          width={80}
          height={54}
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    { title: '模型', dataIndex: 'modelName', width: 120 },
    { title: '阈值', dataIndex: 'confThreshold', width: 76 },
    { title: '目标数', dataIndex: 'objectCount', width: 76 },
    {
      title: '尺寸',
      key: 'size',
      width: 100,
      render: (_, r) => `${r.imageWidth}×${r.imageHeight}`,
    },
    { title: '耗时', key: 'cost', width: 92, render: (_, r) => `${r.costMs} ms` },
    { title: '检测时间', dataIndex: 'createTime', width: 170, render: (t) => fmtTime(t) },
    {
      title: '操作',
      key: 'op',
      width: 110,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => view(r)}>
          <EyeOutlined /> 查看框
        </Button>
      ),
    },
  ]

  return (
    <div className="record-page">
      <div className="stat-row">
        <Card className="stat-card">
          <Statistic title="累计检测次数" value={total} />
        </Card>
        <Card className="stat-card">
          <Statistic title="本页目标总数" value={pageObjects} />
        </Card>
        <Card className="stat-card">
          <Statistic title="本页平均耗时(ms)" value={avgCost} />
        </Card>
        <Button
          type="primary"
          ghost
          loading={loading}
          className="refresh-btn"
          icon={<ReloadOutlined />}
          onClick={() => load(pageNum)}
        >
          刷新
        </Button>
      </div>

      <Card className="panel-card">
        <Table
          className="striped-table"
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          size="small"
          bordered
          scroll={{ x: 980 }}
          pagination={{
            current: pageNum,
            pageSize: PAGE_SIZE,
            total,
            onChange: load,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="检测详情"
        width={720}
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        footer={null}
        destroyOnClose
      >
        {detail ? (
          <div className="dialog-body">
            <ResultImage
              imageUrl={detail.imagePath}
              objects={detailObjects}
              width={detail.imageWidth}
              height={detail.imageHeight}
            />
            <p className="tip-text">
              记录 #{detail.id} · {detail.modelName} · 阈值 {detail.confThreshold} ·{' '}
              {detail.objectCount} 个目标 · 耗时 {detail.costMs}ms
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
