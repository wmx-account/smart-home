<script setup>
// 检测结果画框组件（本项目前端核心）。
// 原理：相对定位容器放原图，绝对定位覆盖层里为每个目标生成一个 div 框；
// 模型坐标基于原图分辨率，网页图片会缩放，所以统一换算成百分比。
const PALETTE = [
  '#f5222d', '#1890ff', '#52c41a', '#faad14', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
]

const props = defineProps({
  imageUrl: { type: String, required: true },
  objects: { type: Array, default: () => [] },
  width: { type: Number, default: 1 },   // 原图宽（像素）
  height: { type: Number, default: 1 },  // 原图高（像素）
})

function colorOf(obj) {
  return PALETTE[(obj.cls_idx ?? 0) % PALETTE.length]
}

// 像素坐标 -> 百分比定位，图片任意缩放框都不会错位
function boxStyle(obj) {
  const w = props.width || 1
  const h = props.height || 1
  return {
    left: `${(obj.lx / w) * 100}%`,
    top: `${(obj.ly / h) * 100}%`,
    width: `${((obj.rx - obj.lx) / w) * 100}%`,
    height: `${((obj.ry - obj.ly) / h) * 100}%`,
    borderColor: colorOf(obj),
  }
}
</script>

<template>
  <div class="result-image">
    <img :src="imageUrl" alt="检测结果" />
    <div class="layer">
      <div v-for="(obj, i) in objects" :key="i" class="box" :style="boxStyle(obj)">
        <span class="tag" :style="{ backgroundColor: colorOf(obj) }">
          {{ obj.cls_name }} {{ (obj.conf * 100).toFixed(0) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-image {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}
.result-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
.layer {
  position: absolute;
  inset: 0;
}
.box {
  position: absolute;
  border: 2px solid;
  box-sizing: border-box;
}
.tag {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #fff;
  padding: 0 5px;
  white-space: nowrap;
}
</style>
