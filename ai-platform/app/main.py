"""FastAPI 入口：接收上传图片 -> 调用 YOLO 推理 -> 返回结构化 JSON。

启动（在 ai-platform 目录下）：
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
在线文档：http://127.0.0.1:8000/docs
"""

import io

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from app.detector import detect

app = FastAPI(title="Smart Home AI 推理服务", version="1.0.0")

# 前后端分离后浏览器直接访问会跨域，阶段4 联调需要；当前先放开所有来源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """健康检查，供 Java 端探活。"""
    return {"code": 0, "msg": "ok", "data": {"service": "ai-platform", "status": "running"}}


@app.post("/detect")
async def detect_image(
    file: UploadFile = File(..., description="待检测图片"),
    model_name: str = Form("yolo11n.pt", description="models 目录下的权重文件名"),
    conf: float = Form(0.25, description="置信度阈值"),
):
    """接收图片并返回目标检测结果。"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持 image/* 图片文件")

    try:
        raw = await file.read()
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        data = detect(image, model_name=model_name, conf=conf)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"推理失败: {exc}") from exc

    return {"code": 0, "msg": "success", "data": data}
