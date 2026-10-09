'use client'

import { useEffect, useState } from 'react'
import { Modal, Table, Pagination } from 'antd'
import { getFanLogs } from '@/lib/device'
import { fanActionText, formatLogTime } from '@/lib/utils'

const PAGE_SIZE = 8

// 风扇操作记录弹窗（分页查询 fan_control_log 审计表）
export default function FanLogModal({ open, onClose }) {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (open) setPage(1)
  }, [open])

  useEffect(() => {
    if (!open) return
    getFanLogs(page, PAGE_SIZE)
      .then((d) => {
        setLogs(d.records || [])
        setTotal(d.total || 0)
      })
      .catch(() => {
        // 忽略
      })
  }, [open, page])

  const columns = [
    { title: '时间', dataIndex: 'createTime', width: 180, render: (t) => formatLogTime(t) },
    { title: '动作', key: 'action', render: (_, r) => fanActionText(r) },
    { title: '来源', dataIndex: 'source', width: 90 },
  ]

  return (
    <Modal
      title="风扇操作记录"
      width={560}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Table columns={columns} dataSource={logs} rowKey="id" size="small" pagination={false} />
      <div className="pager">
        <Pagination
          size="small"
          current={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
        />
      </div>
    </Modal>
  )
}
