/* 构建前烘焙本项目用到的 antd 组件样式（含主题色 + 全局 reset）为静态 CSS。
 *
 * 背景：Next.js 静态导出(output: 'export')不会把 antd v5 运行时 cssinjs 的样式内联进 HTML，
 * 首屏在 JS 水合前会短暂“无样式”(FOUC，导航变圆点列表、按钮变原生)。
 * 按 antd 官方 SSR“整体导出”思路，用与 antd【同一份】@ant-design/cssinjs 渲染一遍项目实际
 * 用到的组件，把样式提取为 antd.min.css 并在 layout 引入，静态产物首屏即带完整样式，消除闪烁，
 * 且可被 Nginx gzip + 强缓存。
 *
 * 关键：必须加载 antd 实际解析到的那份 cssinjs（从 antd 目录 require.resolve），
 * 并保证整个依赖树只有一份 cssinjs（package.json 用 overrides 锁定），
 * 否则 StyleProvider 的 cache 与组件内部的 StyleContext 不是同一实例，会提取为空。
 *
 * 只烘焙“首屏可见”组件；message/notification/Tooltip 等交互后才出现的弹层，其样式由运行时
 * cssinjs 在触发时注入（此时 JS 早已水合），无需烘焙。
 * 由 package.json 的 predev / prebuild 钩子自动执行；产物 app/antd.min.css 为生成文件，已 gitignore。
 */
// 必须在 require react/antd 之前确定运行环境：cssinjs 的 hashId 在 dev/prod 下不同
// （dev 为 css-dev-only-do-not-override-xxx，prod 为 css-xxx）。
// 烘焙出的 CSS 选择器必须与目标运行环境一致，否则类名对不上、样式等于没写。
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV =
    process.env.npm_lifecycle_event === 'predev' ? 'development' : 'production'
}

const fs = require('fs')
const path = require('path')
const React = require('react')
const { renderToString } = require('react-dom/server')

// 从 antd 的位置解析它实际使用的那份 cssinjs，保证 StyleContext 同源
const antdDir = path.dirname(require.resolve('antd/package.json'))
const cssinjsPath = require.resolve('@ant-design/cssinjs', { paths: [antdDir] })
const cssinjsPkg = require(path.join(path.dirname(cssinjsPath), '..', 'package.json'))
const { createCache, extractStyle, StyleProvider } = require(cssinjsPath)
const {
  ConfigProvider,
  App: AntApp,
  Row,
  Col,
  Card,
  Divider,
  Menu,
  Upload,
  Slider,
  Switch,
  Radio,
  Button,
  Tag,
  Statistic,
  Descriptions,
  Progress,
  Empty,
  Spin,
  Image,
  Table,
  Pagination,
  Modal,
} = require('antd')

const h = React.createElement

// 渲染项目实际用到的组件实例，触发 cssinjs 注册对应样式
const demos = [
  h(
    Menu,
    {
      mode: 'horizontal',
      defaultSelectedKeys: ['1'],
      items: [
        { key: '1', label: '目标检测' },
        { key: '2', label: '设备监控' },
      ],
    }
  ),
  h(
    Row,
    { gutter: 16 },
    h(
      Col,
      { span: 12 },
      h(
        Card,
        { title: '卡片标题', extra: h(Tag, { color: 'cyan' }, '标签') },
        h(Upload.Dragger, { beforeUpload: () => false }, h('p', null, '拖拽图片到此处')),
        h(Slider, { defaultValue: 25, min: 5, max: 95 }),
        h(
          'div',
          { style: { marginTop: 12 } },
          h(Button, { type: 'primary' }, '主按钮'),
          h(Button, { style: { marginLeft: 8 } }, '次按钮')
        ),
        h(Descriptions, {
          column: 1,
          bordered: true,
          items: [
            { key: '1', label: '目标', children: 'person' },
            { key: '2', label: '置信度', children: h(Progress, { percent: 88, size: 'small' }) },
          ],
        }),
        h(Empty, { description: '暂无数据' }),
        h(Spin, { spinning: true })
      )
    ),
    h(
      Col,
      { span: 12 },
      h(
        Card,
        null,
        h(Statistic, { title: '检测次数', value: 16 }),
        h(Divider),
        h(Switch, { checked: true, checkedChildren: '开', unCheckedChildren: '关' }),
        h(Radio.Group, {
          defaultValue: 1,
          optionType: 'button',
          buttonStyle: 'solid',
          options: [
            { label: '关', value: 0 },
            { label: '半速', value: 1 },
            { label: '全速', value: 2 },
          ],
        }),
        h(Image, { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', width: 60 }),
        h(Table, {
          columns: [
            { title: '名称', dataIndex: 'name' },
            { title: '值', dataIndex: 'value' },
          ],
          dataSource: [{ key: '1', name: '温度', value: '26℃' }],
          pagination: false,
          size: 'small',
        }),
        h(Pagination, { current: 1, total: 30, pageSize: 8 })
      )
    )
  ),
  // 强制渲染弹窗内容以提取 Modal 样式
  h(Modal, { open: true, title: '操作记录', okText: '确定', cancelText: '取消' }, '弹窗内容'),
]

const cache = createCache()
renderToString(
  h(
    StyleProvider,
    { cache },
    h(
      ConfigProvider,
      { theme: { token: { colorPrimary: '#0e6b7a', borderRadius: 8 } } },
      h(AntApp, null, h('div', null, demos))
    )
  )
)

// plain=true：输出可直接落盘的纯 CSS
const componentCss = extractStyle(cache, true)

// 拼接 antd 官方全局 reset（normalize 基线，去除 ul 默认圆点、统一标题字号等）
let resetCss = ''
const resetPath = path.join(antdDir, 'dist', 'reset.css')
if (fs.existsSync(resetPath)) resetCss = fs.readFileSync(resetPath, 'utf8')

const outputPath = path.resolve(__dirname, '../app/antd.min.css')
const banner = '/* 由 scripts/genAntdCss.cjs 自动生成，请勿手改（主题 #0e6b7a）。 */\n'
const finalCss = banner + resetCss + '\n' + componentCss
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, finalCss)
const ok =
  componentCss.includes('.ant-menu') &&
  componentCss.includes('.ant-card') &&
  componentCss.includes('.ant-table')
console.log(
  `[genAntdCss] env=${process.env.NODE_ENV} cssinjs=${cssinjsPkg.version} reset=${(resetCss.length / 1024).toFixed(1)}KB ` +
    `components=${(componentCss.length / 1024).toFixed(1)}KB total=${(finalCss.length / 1024).toFixed(1)}KB ` +
    `menu=${componentCss.includes('.ant-menu')} card=${componentCss.includes('.ant-card')} ` +
    `table=${componentCss.includes('.ant-table')} primary=${componentCss.includes('0e6b7a')}`
)
if (!ok) {
  console.error('[genAntdCss] 组件样式提取不完整，通常是 cssinjs 出现多实例，请检查 package.json overrides 后重装依赖。')
  process.exit(1)
}
