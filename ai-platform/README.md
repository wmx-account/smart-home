# ai-platform：YOLO 推理服务

FastAPI 封装的 YOLO11 目标检测服务，接收图片、内存推理、返回结构化 JSON。

## 目录

```
ai-platform/
├── app/
│   ├── main.py        # 路由：/health、/detect，跨域与入参校验
│   └── detector.py    # 模型单例加载、结果解析
├── models/            # 权重（yolo11n.pt；阶段1.5 增加自训练 best.pt）
├── test_images/       # bus.jpg（COCO 人物测试）、naruto_t1.png（自训练模型测试）
├── train/             # 数据集、训练脚本（阶段1.5）
└── requirements.txt
```

## 启动（复用 hbkjyolo 环境）

```powershell
cd "D:\My project\Smart Home\ai-platform"
& "D:\yolo_project\Miniconda_install\envs\hbkjyolo\python.exe" -m uvicorn app.main:app --port 8000 --reload
```

## 全新环境（备选）

```powershell
conda create -n smarthome python=3.11 -y
conda activate smarthome
# 先按 https://pytorch.org 安装与本机匹配的 torch/torchvision
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

## 接口

### POST /detect（multipart/form-data）

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| file | 文件 | 必填 | image/* 图片 |
| model_name | 文本 | yolo11n.pt | models 目录下权重文件名 |
| conf | 数字 | 0.25 | 置信度阈值 |

响应：

```json
{"code": 0, "msg": "success",
 "data": {"count": 5, "image_width": 810, "image_height": 1080, "model": "yolo11n.pt",
   "objects": [{"cls_idx": 0, "cls_name": "person", "conf": 0.89,
     "lx": 671.02, "ly": 394.83, "rx": 809.81, "ry": 878.71}]}}
```

## 阶段1验收记录（2026-09-17）

- /health 正常；上传 test_images/bus.jpg 返回 1 个 bus + 4 个 person，字段完整。
