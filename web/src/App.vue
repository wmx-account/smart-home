<script setup>
import { ref } from 'vue'
import DetectPanel from './components/DetectPanel.vue'
import RecordTable from './components/RecordTable.vue'

const tableRef = ref(null)

// 一次新检测成功后，刷新历史表格第一页
function onDetectSuccess() {
  tableRef.value?.load(1)
}
</script>

<template>
  <el-container>
    <el-header class="app-header">
      <h1>智能家居边缘智能系统 · 人物目标检测</h1>
    </el-header>
    <el-main>
      <el-tabs>
        <el-tab-pane label="目标检测">
          <DetectPanel @success="onDetectSuccess" />
        </el-tab-pane>
        <el-tab-pane label="检测历史">
          <RecordTable ref="tableRef" />
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>
