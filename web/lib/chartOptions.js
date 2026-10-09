// ECharts 配置工厂（纯函数，便于复用与测试）。仪表盘的 center / offsetCenter
// 是反复调过的“三层分离”布局：仪表弧在上、数值居中、标题在最下，避免重合。
import { num, formatChartTime } from '@/lib/utils'

export function gaugeOption(value, name, unit, min, max, color, decimals) {
  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        radius: '76%',
        center: ['50%', '38%'],
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, '#e8edf3']] } },
        axisTick: { show: false },
        splitLine: { length: 10, lineStyle: { color: '#c2c9d6' } },
        axisLabel: { distance: 14, color: '#909399', fontSize: 10 },
        pointer: { itemStyle: { color } },
        anchor: { show: true, itemStyle: { color } },
        detail: {
          valueAnimation: true,
          color: '#1f2d3d',
          fontSize: 20,
          offsetCenter: [0, '124%'],
          formatter: (v) =>
            `${decimals ? Number(v).toFixed(decimals) : Math.round(v)}${unit}`,
        },
        title: { offsetCenter: [0, '162%'], color: '#606266', fontSize: 13 },
        data: [{ value: value ?? 0, name }],
      },
    ],
  }
}

// 历史趋势：温湿度走左轴，光照走右轴（0-1000lux），底部带缩放条
export function lineOption(points) {
  const times = points.map((p) => formatChartTime(p.bucketTime))
  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (v == null ? '-' : Number(v).toFixed(1)),
    },
    legend: { data: ['温度', '湿度', '光照'], top: 0 },
    grid: { left: 56, right: 64, top: 40, bottom: 64 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLabel: { fontSize: 10 },
    },
    yAxis: [
      { type: 'value', name: '℃/%', scale: true, axisLabel: { fontSize: 10 } },
      {
        type: 'value',
        name: 'lux',
        position: 'right',
        min: 0,
        max: 1000,
        axisLabel: { fontSize: 10 },
      },
    ],
    dataZoom: [
      { type: 'inside' },
      { type: 'slider', height: 16, bottom: 24 },
    ],
    series: [
      {
        name: '温度', type: 'line', smooth: true, showSymbol: false,
        data: points.map((p) => num(p.temperature)), itemStyle: { color: '#f56c6c' },
      },
      {
        name: '湿度', type: 'line', smooth: true, showSymbol: false,
        data: points.map((p) => num(p.humidity)), itemStyle: { color: '#409eff' },
      },
      {
        name: '光照', type: 'line', smooth: true, showSymbol: false, yAxisIndex: 1,
        data: points.map((p) => num(p.light)), itemStyle: { color: '#e6a23c' },
      },
    ],
  }
}
