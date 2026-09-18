<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { detectImage } from '../api/detect'
import ResultImage from './ResultImage.vue'

const emit = defineEmits(['success'])

const conf = ref(0.25)
const loading = ref(false)
const result = ref(null) // {recordId, imageUrl, detect:{count,image_width,image_height,model,objects}}

// el-upload 的自定义上传：接管文件选择，走我们自己的 api
async function onUpload({ file }) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  loading.value = true
  result.value = null
  try {
    const data = await detectImage(file, { conf: conf.value })
    result.value = data
    ElMessage.success(`检测完成，共识别 ${data.detect.count} 个目标`)
    emit('success') // 通知父组件刷新历史表格
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-upload :show-file-list="false" accept="image/*" :http-request="onUpload">
        <el-button type="primary" :loading="loading">选择图片并检测</el-button>
      </el-upload>
      <span>置信度阈值：</span>
      <el-input-number v-model="conf" :min="0.05" :max="0.95" :step="0.05" size="small" style="width: 120px" />
      <span v-if="loading" class="tip">首次推理需要加载模型，可能要几秒...</span>
    </div>

    <el-empty v-if="!result && !loading" description="上传一张图片，开始人物目标检测" />

    <div v-else-if="result" class="result-wrap">
      <ResultImage
        :image-url="result.imageUrl"
        :objects="result.detect.objects"
        :width="result.detect.image_width"
        :height="result.detect.image_height"
      />
      <el-descriptions :column="3" border size="small" class="result-meta">
        <el-descriptions-item label="记录ID">{{ result.recordId }}</el-descriptions-item>
        <el-descriptions-item label="模型">{{ result.detect.model }}</el-descriptions-item>
        <el-descriptions-item label="目标数">{{ result.detect.count }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>
