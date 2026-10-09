'use client'

import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Upload,
  Slider,
  Tag,
  Button,
  Empty,
  Spin,
  Descriptions,
  Progress,
} from 'antd'
import {
  UploadOutlined,
  InboxOutlined,
  PictureOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { detectImage } from '@/lib/detect'
import { colorOf } from '@/lib/utils'
import notify from '@/lib/notify'
import ResultImage from '@/components/ResultImage'

export default function DetectPanel() {
  const [conf, setConf] = useState(0.25)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // {recordId,imageUrl,detect:{...}}
  const [activeIdx, setActiveIdx] = useState(-1)

  // Upload.Dragger 的自定义上传：接管文件，走我们自己的接口
  async function onUpload(file) {
    setLoading(true)
    setResult(null)
    setActiveIdx(-1)
    try {
      const data = await detectImage(file, { conf })
      setResult(data)
      notify.success(`检测完成，共识别 ${data.detect.count} 个目标`)
    } finally {
      setLoading(false)
    }
  }

  // 关闭当前图片，回到未上传的空状态
  function clearResult() {
    setResult(null)
    setActiveIdx(-1)
  }

  // 点击目标明细，高亮 / 取消高亮对应框
  function toggleHighlight(i) {
    setActiveIdx((prev) => (prev === i ? -1 : i))
  }

  const objects = result?.detect?.objects || []

  return (
    <Row gutter={[20, 20]}>
      {/* 左侧：上传与参数 */}
      <Col xs={24} md={9}>
        <Card
          className="panel-card"
          title={
            <span className="card-title">
              <UploadOutlined /> 上传图片
            </span>
          }
        >
          <Upload.Dragger
            name="file"
            accept="image/*"
            showUploadList={false}
            disabled={loading}
            beforeUpload={(file) => {
              if (!file.type.startsWith('image/')) {
                notify.warning('请选择图片文件')
                return Upload.LIST_IGNORE
              }
              return true
            }}
            customRequest={({ file }) => onUpload(file)}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              拖拽图片到此处，或<em>点击选择</em>
            </p>
            <p className="ant-upload-hint">支持 jpg / png，图片仅在本机处理与保存</p>
          </Upload.Dragger>

          <div className="conf-row">
            <div className="conf-label">
              置信度阈值
              <Tag color="default">{Math.round(conf * 100)}%</Tag>
            </div>
            <Slider
              min={0.05}
              max={0.95}
              step={0.05}
              value={conf}
              onChange={setConf}
              tooltip={{ formatter: (v) => `${Math.round(v * 100)}%` }}
            />
            <div className="conf-hint">阈值越高，只保留模型越确信的目标</div>
          </div>
        </Card>
      </Col>

      {/* 右侧：检测结果 */}
      <Col xs={24} md={15}>
        <Card
          className="panel-card"
          title={
            <span className="card-title">
              <PictureOutlined /> 检测结果
            </span>
          }
          extra={
            result ? (
              <Button type="primary" danger ghost size="small" onClick={clearResult}>
                <CloseOutlined /> 关闭图片
              </Button>
            ) : null
          }
        >
          {!result && !loading ? (
            <Empty description="尚未上传图片，检测结果将显示在这里" style={{ padding: '60px 0' }} />
          ) : null}

          <Spin spinning={loading} tip="模型推理中，首次加载可能需要数秒...">
            <div className="result-box">
              {result ? (
                <>
                  <ResultImage
                    imageUrl={result.imageUrl}
                    objects={objects}
                    width={result.detect.image_width}
                    height={result.detect.image_height}
                    activeIndex={activeIdx}
                  />

                  <Descriptions
                    className="result-meta"
                    column={3}
                    bordered
                    size="small"
                    items={[
                      { label: '记录ID', children: result.recordId },
                      { label: '模型', children: result.detect.model },
                      { label: '目标数', children: result.detect.count },
                    ]}
                  />

                  <div className="obj-title">目标明细（点击一行可高亮对应框）</div>
                  <div style={{ maxHeight: 220, overflow: 'auto' }}>
                    {objects.map((o, i) => (
                      <div
                        key={i}
                        className={`obj-row${activeIdx === i ? ' active' : ''}`}
                        onClick={() => toggleHighlight(i)}
                      >
                        <span
                          className="obj-color"
                          style={{ backgroundColor: colorOf(o.cls_idx) }}
                        />
                        <span className="obj-name">{o.cls_name}</span>
                        <Progress
                          className="obj-bar"
                          percent={Math.round(o.conf * 100)}
                          strokeColor={colorOf(o.cls_idx)}
                          size="small"
                          showInfo={false}
                        />
                        <span className="obj-conf">{(o.conf * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </Spin>
        </Card>
      </Col>
    </Row>
  )
}
