"""YOLO 推理封装：模型加载与检测结果解析。

职责：
- 按文件名加载 models/ 目录下的权重，进程内缓存，避免每次请求重复加载；
- 对 PIL 图片执行推理，解析为结构化字典（类别、置信度、xyxy 坐标）。
"""

from pathlib import Path

from ultralytics import YOLO

# ai-platform/models
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"

# 已加载模型缓存：{模型文件名: YOLO 实例}
_models: dict[str, YOLO] = {}


def get_model(model_name: str = "yolo11n.pt") -> YOLO:
    """按文件名获取模型，同一模型在进程内只加载一次。"""
    if model_name not in _models:
        model_path = MODEL_DIR / model_name
        if not model_path.exists():
            raise FileNotFoundError(f"模型文件不存在: {model_path}")
        _models[model_name] = YOLO(str(model_path))
    return _models[model_name]


def detect(image, model_name: str = "yolo11n.pt", conf: float = 0.25) -> dict:
    """对 PIL / numpy 图片进行目标检测。

    返回：{"count", "image_width", "image_height", "model", "objects": [...]}
    坐标字段沿用原 Qt 工程约定：lx/ly 为左上角，rx/ry 为右下角。
    """
    model = get_model(model_name)
    results = model(image, conf=conf, verbose=False)
    result = results[0]

    objects = []
    if result.boxes is not None:
        for box in result.boxes:
            cls_idx = int(box.cls.cpu().numpy()[0])
            xyxy = box.xyxy.cpu().numpy()[0]
            objects.append(
                {
                    "cls_idx": cls_idx,
                    "cls_name": result.names[cls_idx],
                    "conf": round(float(box.conf.cpu().numpy()[0]), 2),
                    "lx": round(float(xyxy[0]), 2),
                    "ly": round(float(xyxy[1]), 2),
                    "rx": round(float(xyxy[2]), 2),
                    "ry": round(float(xyxy[3]), 2),
                }
            )

    # orig_shape 为 (高, 宽)
    height, width = result.orig_shape
    return {
        "count": len(objects),
        "image_width": int(width),
        "image_height": int(height),
        "model": model_name,
        "objects": objects,
    }
