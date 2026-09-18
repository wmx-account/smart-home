<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { detectImage } from '../api/detect'
import ResultImage from './ResultImage.vue'

const emit = defineEmits(['success'])

const PALETTE = [
  '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

const conf = ref(0.25)
const loading = ref(false)
const result = ref(null) // {recordId, imageUrl, detect:{count,image_width,image_height,model,objects}}
const activeIdx = ref(-1)

function colorOf(idx) {
  return PALETTE[(idx ?? 0) % PALETTE.length]
}

// el-upload 的自定义上传：接管文件选择，走我们自己的 api
async function onUpload({ file }) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  loading.value = true
  result.value = null
  activeIdx.value = -1
  try {
    const data = await detectImage(file, { conf: conf.value })
    result.value = data
    ElMessage.success(`检测完成，共识别 ${data.detect.count} 个目标`)
    emit('success') // 通知父组件刷新历史表格
  } finally {
    loading.value = false
  }
}

// 关闭当前图片，回到未上传的空状态
function clearResult() {
  result.value = null
  activeIdx.value = -1
}

// 点击目标明细，高亮/取消高亮对应框
function toggleHighlight(i) {
  activeIdx.value = activeIdx.value === i ? -1 : i
}
</script>

<template>
  <el-row :gutter="20">
    <!-- 左侧：上传与参数 -->
    <el-col :xs="24" :md="9">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <span class="card-title"><el-icon><Upload /></el-icon> 上传图片</span>
        </template>

        <el-upload
          drag
          :show-file-list="false"
          accept="image/*"
          :http-request="onUpload"
          :disabled="loading"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽图片到此处，或<em>点击选择</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 jpg / png，图片仅在本机处理与保存</div>
          </template>
        </el-upload>

        <div class="conf-row">
          <div class="conf-label">
            置信度阈值
            <el-tag size="small" type="info">{{ Math.round(conf * 100) }}%</el-tag>
          </div>
          <el-slider v-model="conf" :min="0.05" :max="0.95" :step="0.05" show-tooltip="false" />
          <div class="conf-hint">阈值越高，只保留模型越确信的目标</div>
        </div>
      </el-card>
    </el-col>

    <!-- 右侧：检测结果 -->
    <el-col :xs="24" :md="15">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="card-header-between">
            <span class="card-title"><el-icon><Picture /></el-icon> 检测结果</span>
            <el-button v-if="result" type="danger" plain size="small" @click="clearResult">
              <el-icon><Close /></el-icon>&nbsp;关闭图片
            </el-button>
          </div>
        </template>

        <el-empty v-if="!result && !loading" description="尚未上传图片，检测结果将显示在这里" />

        <div v-loading="loading" element-loading-text="模型推理中，首次加载可能需要数秒..." class="result-box">
          <template v-if="result">
            <ResultImage
              :image-url="result.imageUrl"
              :objects="result.detect.objects"
              :width="result.detect.image_width"
              :height="result.detect.image_height"
              :active-index="activeIdx"
            />

            <el-descriptions :column="3" border size="small" class="result-meta">
              <el-descriptions-item label="记录ID">{{ result.recordId }}</el-descriptions-item>
              <el-descriptions-item label="模型">{{ result.detect.model }}</el-descriptions-item>
              <el-descriptions-item label="目标数">{{ result.detect.count }}</el-descriptions-item>
            </el-descriptions>

            <div class="obj-title">目标明细（点击一行可高亮对应框）</div>
            <el-scrollbar max-height="220px">
              <div
                v-for="(o, i) in result.detect.objects"
                :key="i"
                class="obj-row"
                :class="{ active: activeIdx === i }"
                @click="toggleHighlight(i)"
              >
                <span class="obj-color" :style="{ backgroundColor: colorOf(o.cls_idx) }"></span>
                <span class="obj-name">{{ o.cls_name }}</span>
                <el-progress
                  class="obj-bar"
                  :percentage="Math.round(o.conf * 100)"
                  :color="colorOf(o.cls_idx)"
                  :stroke-width="10"
                />
                <span class="obj-conf">{{ (o.conf * 100).toFixed(1) }}%</span>
              </div>
            </el-scrollbar>
          </template>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>
