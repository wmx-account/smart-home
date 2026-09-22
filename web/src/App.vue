<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import DetectPanel from './components/DetectPanel.vue'
import DevicePanel from './components/DevicePanel.vue'
import RecordTable from './components/RecordTable.vue'
import { getHealth } from './api/detect'

const tableRef = ref(null)
const activeTab = ref('detect')
const serverOnline = ref(false)
const aiOnline = ref(false)
let timer = null

// 轮询健康检查，在顶部实时显示两个后端服务的在线状态
async function ping() {
  try {
    const d = await getHealth()
    serverOnline.value = d.status === 'running'
    aiOnline.value = d.aiPlatform?.status === 'running'
  } catch (e) {
    serverOnline.value = false
    aiOnline.value = false
  }
}

// 一次新检测成功后，刷新历史表格第一页
function onDetectSuccess() {
  tableRef.value?.load(1)
}

onMounted(() => {
  ping()
  timer = setInterval(ping, 15000)
})
onUnmounted(() => timer && clearInterval(timer))
</script>

<template>
  <el-container class="app-shell">
    <el-header class="app-header" height="72">
      <div class="brand">
        <el-icon class="brand-icon"><Cpu /></el-icon>
        <div class="brand-text">
          <h1>智能家居边缘智能系统</h1>
          <p>YOLO 目标检测 · 设备实时监控 · SpringBoot + FastAPI + Vue3</p>
        </div>
      </div>
      <div class="status">
        <div class="status-item" :class="{ on: serverOnline }">
          <span class="dot"></span>业务服务 8080
          <span class="state">{{ serverOnline ? '在线' : '离线' }}</span>
        </div>
        <div class="status-item" :class="{ on: aiOnline }">
          <span class="dot"></span>AI 推理 8000
          <span class="state">{{ aiOnline ? '在线' : '离线' }}</span>
        </div>
      </div>
    </el-header>

    <el-main class="app-main">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane name="detect">
          <template #label>
            <span class="tab-label"><el-icon><Search /></el-icon>目标检测</span>
          </template>
          <DetectPanel @success="onDetectSuccess" />
        </el-tab-pane>
        <el-tab-pane name="device">
          <template #label>
            <span class="tab-label"><el-icon><Odometer /></el-icon>设备监控</span>
          </template>
          <DevicePanel />
        </el-tab-pane>
        <el-tab-pane name="records">
          <template #label>
            <span class="tab-label"><el-icon><Document /></el-icon>检测历史</span>
          </template>
          <RecordTable ref="tableRef" />
        </el-tab-pane>
      </el-tabs>
    </el-main>

    <el-footer class="app-footer" height="48">
      AI 辅助开发实践项目 · 检测图片与记录仅保存在本机 MySQL 与 uploads 目录
    </el-footer>
  </el-container>
</template>
