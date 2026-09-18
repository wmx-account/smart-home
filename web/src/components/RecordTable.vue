<script setup>
import { ref, onMounted } from 'vue'
import { getRecords, getRecordDetail } from '../api/detect'
import ResultImage from './ResultImage.vue'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(8)
const loading = ref(false)

const dialogVisible = ref(false)
const detail = ref(null)
const detailObjects = ref([])

async function load(page = 1) {
  pageNum.value = page
  loading.value = true
  try {
    const data = await getRecords(page, pageSize.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function view(row) {
  const data = await getRecordDetail(row.id)
  detail.value = data
  // 详情接口的 resultJson 是字符串，解析出 objects 给画框组件
  detailObjects.value = JSON.parse(data.resultJson || '{}').objects || []
  dialogVisible.value = true
}

// 兼容后端 LocalDateTime 的两种序列化形式（ISO 字符串或数组）
function fmtTime(t) {
  if (!t) return ''
  if (Array.isArray(t)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = t
    const pad = (x) => String(x).padStart(2, '0')
    return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(mi)}:${pad(s)}`
  }
  return String(t).replace('T', ' ').substring(0, 19)
}

defineExpose({ load })
onMounted(() => load(1))
</script>

<template>
  <el-table :data="list" v-loading="loading" border stripe size="small">
    <el-table-column prop="id" label="ID" width="64" />
    <el-table-column label="缩略图" width="110">
      <template #default="{ row }">
        <el-image
          :src="row.imagePath"
          :preview-src-list="[row.imagePath]"
          fit="cover"
          style="width: 80px; height: 54px; border-radius: 4px"
        />
      </template>
    </el-table-column>
    <el-table-column prop="modelName" label="模型" width="120" />
    <el-table-column prop="confThreshold" label="阈值" width="76" />
    <el-table-column prop="objectCount" label="目标数" width="76" />
    <el-table-column label="尺寸" width="100">
      <template #default="{ row }">{{ row.imageWidth }}×{{ row.imageHeight }}</template>
    </el-table-column>
    <el-table-column label="耗时" width="92">
      <template #default="{ row }">{{ row.costMs }} ms</template>
    </el-table-column>
    <el-table-column label="检测时间" width="170">
      <template #default="{ row }">{{ fmtTime(row.createTime) }}</template>
    </el-table-column>
    <el-table-column label="操作" width="90">
      <template #default="{ row }">
        <el-button link type="primary" @click="view(row)">查看框</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-pagination
    class="pager"
    background
    layout="prev, pager, next, total"
    :total="total"
    :page-size="pageSize"
    :current-page="pageNum"
    @current-change="load"
  />

  <el-dialog v-model="dialogVisible" title="检测详情" width="720px">
    <div v-if="detail" class="dialog-body">
      <ResultImage
        :image-url="detail.imagePath"
        :objects="detailObjects"
        :width="detail.imageWidth"
        :height="detail.imageHeight"
      />
      <p class="tip-text">
        记录 #{{ detail.id }} · {{ detail.modelName }} · 阈值 {{ detail.confThreshold }}
        · {{ detail.objectCount }} 个目标 · 耗时 {{ detail.costMs }}ms
      </p>
    </div>
  </el-dialog>
</template>
