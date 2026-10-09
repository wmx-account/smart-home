// ECharts 按需引入：只注册本项目用到的图表与组件，tree-shaking 后体积远小于全量引入。
// 全量 `import * as echarts from 'echarts'` 会打包所有图表/坐标系/组件，
// 这里仅注册仪表盘、折线图及其依赖，显著减小设备页 / 历史页的 chunk。
import * as echarts from 'echarts/core'
import { GaugeChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  // 图表：仪表盘（实时温湿度/光照）、折线图（历史趋势）
  GaugeChart,
  LineChart,
  // 组件：直角坐标系网格、悬浮提示、图例、区域缩放（inside + slider）
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  // 渲染器
  CanvasRenderer,
])

export default echarts
