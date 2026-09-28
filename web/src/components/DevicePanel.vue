<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import {
  getDeviceStatus,
  controlFan,
  getSensorData,
  getFanLogs,
  DEVICE_STREAM_URL,
} from '../api/device'

// ===== 连接与数据状态 =====
const connState = ref('connecting') // connecting / online
const snap = ref(null)
const fanPower = ref(false)
const fanSpeed = ref(1)
const sending = ref(false)

// ===== ECharts 仪表盘 =====
const tempRef = ref(null)
const humRef = ref(null)
const lightRef = ref(null)
let charts = []

function gaugeOption(value, name, unit, min, max, color, decimals) {
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
          formatter: (v) => `${decimals ? Number(v).toFixed(decimals) : Math.round(v)}${unit}`,
        },
        title: { offsetCenter: [0, '162%'], color: '#606266', fontSize: 13 },
        data: [{ value: value ?? 0, name }],
      },
    ],
  }
}

function makeChart(el, option) {
  const chart = echarts.init(el)
  chart.setOption(option)
  charts.push(chart)
}

function updateCharts(s) {
  if (charts.length < 3) return
  charts[0].setOption(gaugeOption(s.temperature, '温度', '℃', 10, 40, '#f56c6c', 1))
  charts[1].setOption(gaugeOption(s.humidity, '湿度', '%', 0, 100, '#409eff', 1))
  charts[2].setOption(gaugeOption(s.light, '光照', 'lx', 0, 1000, '#e6a23c', 0))
}

// ===== 历史趋势折线图 =====
const histRange = ref('1h')
const histRef = ref(null)
let histChart = null

function num(v) {
  return v == null ? null : Number(v)
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatChartTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function lineOption(points) {
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

async function loadHistory() {
  try {
    const list = await getSensorData(histRange.value)
    if (histChart) histChart.setOption(lineOption(list || []), true)
  } catch (e) {
    // 历史加载失败不影响实时监控
  }
}

// ===== 风扇操作记录弹窗 =====
const logDialog = ref(false)
const fanLogs = ref([])
const logTotal = ref(0)
const logPage = ref(1)

async function openFanLogs() {
  logDialog.value = true
  logPage.value = 1
  await loadFanLogs()
}

async function loadFanLogs() {
  try {
    const d = await getFanLogs(logPage.value, 8)
    fanLogs.value = d.records || []
    logTotal.value = d.total || 0
  } catch (e) {
    // 忽略
  }
}

function onLogPage(p) {
  logPage.value = p
  loadFanLogs()
}

function actionText(row) {
  return row.power === 1 ? `开启 · ${row.speed === 2 ? '全速' : '半速'}` : '关闭'
}

function formatLogTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

// ===== 数据应用 / 控制 =====
function applySnap(s) {
  snap.value = s
  fanPower.value = !!s.fanPower
  fanSpeed.value = s.fanSpeed >= 1 ? s.fanSpeed : 1
  updateCharts(s)
}

function speedName(speed) {
  return speed === 2 ? '全速' : speed === 1 ? '半速' : '关闭'
}

// 控制失败后重新拉一次真实状态回滚 UI，避免界面与后端不一致
function rollback() {
  getDeviceStatus().then(applySnap).catch(() => {})
}

async function onPowerChange(power) {
  sending.value = true
  try {
    const s = await controlFan(power, power ? fanSpeed.value : 0)
    applySnap(s)
    ElMessage.success(power ? `风扇已开启（${speedName(s.fanSpeed)}）` : '风扇已关闭')
  } catch (e) {
    rollback()
  } finally {
    sending.value = false
  }
}

async function onSpeedChange(speed) {
  if (!fanPower.value) return
  sending.value = true
  try {
    const s = await controlFan(true, speed)
    applySnap(s)
    ElMessage.success(`已切换为${speedName(speed)}`)
  } catch (e) {
    rollback()
  } finally {
    sending.value = false
  }
}

function formatTs(ts) {
  return ts ? new Date(ts).toLocaleTimeString('zh-CN', { hour12: false }) : ''
}

// ===== SSE：原生 EventSource，浏览器断线自动重连 =====
let es = null
function startSse() {
  es = new EventSource(DEVICE_STREAM_URL)
  es.addEventListener('open', () => {
    connState.value = 'online'
  })
  es.addEventListener('telemetry', (e) => {
    connState.value = 'online'
    try {
      applySnap(JSON.parse(e.data))
    } catch (err) {
      // 单帧解析失败不影响后续推送
    }
  })
  es.addEventListener('error', () => {
    // EventSource 会自动重连，重连期间 readyState=CONNECTING，提示用户即可
    connState.value = es && es.readyState === EventSource.CLOSED ? 'closed' : 'connecting'
  })
}

function resizeCharts() {
  charts.forEach((c) => c.resize())
  if (histChart) histChart.resize()
}

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  // 仪表盘
  makeChart(tempRef.value, gaugeOption(null, '温度', '℃', 10, 40, '#f56c6c', 1))
  makeChart(humRef.value, gaugeOption(null, '湿度', '%', 0, 100, '#409eff', 1))
  makeChart(lightRef.value, gaugeOption(null, '光照', 'lx', 0, 1000, '#e6a23c', 0))
  // 历史趋势
  histChart = echarts.init(histRef.value)
  // 本面板在切到设备 Tab 时才首次渲染，init 瞬间容器宽度可能还没稳定；
  // ResizeObserver 在布局稳定（尺寸变化）时自动 resize，同时兼顾后续窗口/布局变化
  resizeObserver = new ResizeObserver(() => resizeCharts())
  ;[tempRef.value, humRef.value, lightRef.value, histRef.value].forEach((el) =>
    resizeObserver.observe(el),
  )
  window.addEventListener('resize', resizeCharts)
  // 先拉一帧快照，再订阅 SSE 持续刷新
  getDeviceStatus().then(applySnap).catch(() => {})
  startSse()
  loadHistory()
})

onUnmounted(() => {
  if (es) es.close()
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', resizeCharts)
  charts.forEach((c) => c.dispose())
  charts = []
  if (histChart) {
    histChart.dispose()
    histChart = null
  }
})
</script>

<template>
  <div class="device-page">
    <!-- 实时遥测 -->
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="card-header-between">
          <span class="card-title"><el-icon><Odometer /></el-icon> 设备实时监控</span>
          <div class="conn">
            <el-tag :type="connState === 'online' ? 'success' : 'warning'" size="small" effect="plain">
              <span class="dot" :class="connState"></span>
              {{ connState === 'online' ? 'SSE 已连接' : '重连中…' }}
            </el-tag>
            <el-tag v-if="snap" type="info" size="small" effect="plain">
              更新于 {{ formatTs(snap.ts) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="8"><div ref="tempRef" class="chart"></div></el-col>
        <el-col :xs="24" :sm="8"><div ref="humRef" class="chart"></div></el-col>
        <el-col :xs="24" :sm="8"><div ref="lightRef" class="chart"></div></el-col>
      </el-row>
      <div class="hint">
        温湿度 / 光照由后端每 2s 通过 SSE（text/event-stream）主动推送；当前为内置 Mock 设备
        （device.gateway.type=mock），将来替换为真实 STM32 网关时前端无需改动。
      </div>
    </el-card>

    <!-- 历史趋势 -->
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="card-header-between">
          <span class="card-title"><el-icon><TrendCharts /></el-icon> 历史趋势</span>
          <el-radio-group v-model="histRange" size="small" @change="loadHistory">
            <el-radio-button value="1h">近1小时</el-radio-button>
            <el-radio-button value="1d">近1天</el-radio-button>
            <el-radio-button value="7d">近7天</el-radio-button>
            <el-radio-button value="30d">近30天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="histRef" class="hist-chart"></div>
    </el-card>

    <!-- 风扇控制（上行走 REST） -->
    <el-card shadow="never" class="panel-card">
      <template #header>
        <div class="card-header-between">
          <span class="card-title"><el-icon><Wind /></el-icon> 风扇控制</span>
          <el-button size="small" text type="primary" @click="openFanLogs">
            <el-icon><Document /></el-icon> 操作记录
          </el-button>
        </div>
      </template>
      <div class="fan-row">
        <span class="fan-label">电源</span>
        <el-switch
          v-model="fanPower"
          :loading="sending"
          active-text="开启"
          inactive-text="关闭"
          @change="onPowerChange"
        />
        <el-divider direction="vertical" />
        <span class="fan-label">档位</span>
        <el-radio-group
          v-model="fanSpeed"
          :disabled="!fanPower || sending"
          @change="onSpeedChange"
        >
          <el-radio-button :value="1">半速</el-radio-button>
          <el-radio-button :value="2">全速</el-radio-button>
        </el-radio-group>
        <el-tag :type="fanPower ? 'success' : 'info'" effect="dark" class="fan-state">
          {{ fanPower ? `运行中 · ${speedName(fanSpeed)}` : '已关闭' }}
        </el-tag>
      </div>
      <div class="hint">
        控制指令走 REST（POST /api/device/fan）并写入 fan_control_log 审计；开风扇后温度按档位下降
        （半速趋向约 22℃、全速约 18℃），关机回升到环境温约 26℃，形成联动闭环。
      </div>
    </el-card>

    <!-- 风扇操作记录弹窗 -->
    <el-dialog v-model="logDialog" title="风扇操作记录" width="560px">
      <el-table :data="fanLogs" size="small" stripe>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ formatLogTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="动作">
          <template #default="{ row }">{{ actionText(row) }}</template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="90" />
      </el-table>
      <div class="pager">
        <el-pagination
          layout="prev, pager, next"
          :total="logTotal"
          :page-size="8"
          :current-page="logPage"
          small
          @current-change="onLogPage"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.device-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}
.conn {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conn .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e6a23c;
  margin-right: 4px;
}
.conn .dot.online {
  background: #67c23a;
}
.conn .dot.connecting {
  background: #e6a23c;
  animation: blink 1s infinite;
}
@keyframes blink {
  50% {
    opacity: 0.3;
  }
}
.chart {
  width: 100%;
  height: 300px;
}
.hist-chart {
  width: 100%;
  height: 320px;
}
.fan-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.fan-label {
  font-size: 14px;
  color: #606266;
}
.fan-state {
  margin-left: auto;
}
.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
  line-height: 1.7;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
