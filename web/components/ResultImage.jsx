import { colorOf } from '@/lib/utils'

// 检测结果画框组件（前端核心）。
// 原理：相对定位容器放原图，绝对定位覆盖层里为每个目标生成一个 div 框；
// 模型坐标基于原图分辨率，网页图片会缩放，所以统一换算成百分比。
export default function ResultImage({
  imageUrl,
  objects = [],
  width = 1,
  height = 1,
  activeIndex = -1,
}) {
  // 像素坐标 -> 百分比定位，图片任意缩放框都不会错位
  function boxStyle(obj) {
    const w = width || 1
    const h = height || 1
    return {
      left: `${(obj.lx / w) * 100}%`,
      top: `${(obj.ly / h) * 100}%`,
      width: `${((obj.rx - obj.lx) / w) * 100}%`,
      height: `${((obj.ry - obj.ly) / h) * 100}%`,
      borderColor: colorOf(obj.cls_idx),
    }
  }

  // 高亮：选中的框加强，其余框变淡
  function boxClass(i) {
    if (activeIndex < 0) return ''
    return activeIndex === i ? 'hit' : 'dim'
  }

  return (
    <div className="result-image">
      <img src={imageUrl} alt="检测结果" />
      <div className="ri-layer">
        {objects.map((obj, i) => (
          <div key={i} className={`ri-box ${boxClass(i)}`} style={boxStyle(obj)}>
            <span className="ri-tag" style={{ backgroundColor: colorOf(obj.cls_idx) }}>
              {obj.cls_name} {(obj.conf * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
