# Smart Home 智能家居边缘智能系统（Web 重构版）

浏览器可用的"图片上传 → 人物目标检测 → 结果可视化"AI 全栈系统，由原华清远见实训项目（STM32 + Linux C 网关 + Qt + Python YOLO）Web 化重构而来，全程采用 AI 辅助编程（Vibe Coding）完成。

## 架构

| 层 | 目录 | 技术栈 | 状态 |
|---|---|---|---|
| AI 推理层 | `ai-platform/` | Python 3.11 + FastAPI + YOLO11(ultralytics 8.3.86) | ✅ 阶段1完成 |
| 业务服务层 | `server/` | SpringBoot（Java 17），转发推理请求、记录入库 | ⬜ 阶段2/3 |
| 展示层 | `web/` | Vue3 + Vite + Element Plus，Canvas 绘制检测框 | ⬜ 阶段4 |
| 采集接入层 | 原实训资产 | STM32 + Linux C 网关 + Modbus TCP，仅背景保留 | — |

数据流：`Vue 前端 → SpringBoot /api/detect → FastAPI /detect → YOLO11 推理 → 结构化 JSON 原路返回 → Canvas 画框`

## 快速开始

### AI 推理服务（ai-platform）

```powershell
# 使用已配置好的 conda 环境 hbkjyolo（Python 3.11，含 torch 2.13 / ultralytics 8.3.86）
cd ai-platform
& "D:\yolo_project\Miniconda_install\envs\hbkjyolo\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- 在线接口文档：http://127.0.0.1:8000/docs
- 健康检查：http://127.0.0.1:8000/health
- 在 /docs 中用 `POST /detect` 上传 `test_images/bus.jpg` 可看到 person/bus 检测结果

全新环境依赖安装见 `ai-platform/README.md`。

## 文档

- 完整项目背景、接口契约、进度与交接信息：[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)
- 原实训训练评估结果：`docs/train-result/`
