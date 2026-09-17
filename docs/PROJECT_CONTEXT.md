# 项目交接手册（PROJECT_CONTEXT）

> 本文件是项目的唯一权威上下文。任何新对话 / 新 Agent / 新设备接手时，**先读本文件和 README，再看 `git log`**，然后按"当前进度与下一步"继续。每完成一个阶段必须更新本文件并提交。
> 最近更新：2026-09-17，阶段 1 已完成并验收通过

---

## 1. 项目背景与定位

- 项目名：Smart Home（智能家居边缘智能系统 Web 化重构版）
- 起源：华清远见毕业实习（实训）项目，原形态为 STM32 + Linux C 网关 + Qt 上位机 + Python(YOLO) 的边缘智能 demo，由机构老师带全班走通。
- 重构动机：原上位机为 Qt 单机程序、Python 端用原生 socket 私有二进制协议通信；为面向 **AI 应用开发 / AI 全栈实习岗**，重构为浏览器可用的 Web 系统，并以 AI 辅助编程（Vibe Coding）方式完成三端开发。
- 求职定位：全栈侧重后端。本项目证明"AI 辅助开发工作流 + 异构服务（Java 业务 / Python AI）集成 + 前端 Vibe Coding"能力。

## 2. 真实经历边界（写简历与面试回答的红线，不可夸大）

| 事实 | 边界 |
|---|---|
| 原实训 demo | 老师带做、走完一遍流程，真机仅 1-2 个客户端，**没有做过压测**，简历不写并发数/压测/性能数字 |
| 数据标注 | train/val 各 41 帧（共 82 帧）《死神 vs 火影》游戏抽帧图，两个类别 0=鸣人(mingren)、1=带土(daitu)，**标注为本人亲手完成** |
| 模型训练 | 老师带做，yolo11n.pt 起步迁移训练 50 epochs（batch16/imgsz640），本人跑通过但当时未深入掌握；**阶段 1.5 重跑补做** |
| 原训练指标 | results.csv 记录 mAP50=0.975、mAP50-95=0.840、P=0.987、R=0.975。**注意：原 val 是 train 的复制（文件名大小完全相同），验证集划分不规范，指标虚高，不能代表泛化能力** |
| 业务检测 | Web 系统主线用官方 yolo11n.pt（COCO 80 类，含 person）做人物目标检测；自训练 best.pt 仅作为"掌握训练全流程"的佐证与可选模型 |
| Web 重构（SpringBoot/Vue） | 本人在 AI 辅助下从零完成，必须能讲清每个模块的数据流，不能只当甩手掌柜 |
| 措辞 | 写"人物目标检测"，不写"人脸识别"；写"迁移训练/训练流程"，不写"独立设计训练方案/调参" |

## 3. 目标架构（四层）

```
① 采集接入层  STM32 + Linux C 网关（Modbus TCP / TCP 转发）—— 原实训资产，仅背景描述，不重构
② 业务服务层  server/  SpringBoot(Java)：收图、编排调用 AI 服务、检测记录入库、结果回传（阶段2）
③ AI 推理层  ai-platform/  FastAPI(Python) + YOLO11：人物目标检测，返回框坐标/类别/置信度（阶段1）
④ 展示层      web/  Vue3 + Element Plus（Vibe Coding 生成）：上传、Canvas 画框、历史记录（阶段4）
```

数据流：浏览器上传图片 → SpringBoot `POST /api/detect` → HTTP 转发 Python `POST /detect` → YOLO 推理 → 结构化 JSON 原路返回 → 前端 Canvas 绘制检测框。

## 4. 接口契约（三层共用，改动需三方同步）

### AI 服务 `POST /detect`（multipart/form-data）
- 入参：`file`=图片文件；`model_name`=模型文件名（默认 yolo11n.pt，预留 best.pt）；`conf`=置信度阈值（默认 0.25）
- 出参：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "count": 1,
    "image_width": 810,
    "image_height": 1080,
    "model": "yolo11n.pt",
    "objects": [
      {"cls_idx": 0, "cls_name": "person", "conf": 0.92,
       "lx": 12.3, "ly": 45.6, "rx": 200.1, "ry": 400.2}
    ]
  }
}
```
- 字段沿用原 Qt 工程 JSON 设计（cls_idx/cls_name/conf/lx/ly/rx/ry），传输层由私有 TCP 换为 HTTP；修正了原代码只回第一个目标的 bug（原 returnResultTcp 中 break）。
- 另有 `GET /health` 健康检查；在线文档 `/docs`。

## 5. 目录结构

```
Smart Home/
├── .gitignore
├── README.md                    # 三端启动说明（阶段推进中补全）
├── docs/
│   ├── PROJECT_CONTEXT.md       # 本文件
│   └── train-result/            # 原实训训练评估图、results.csv（佐证材料）
├── ai-platform/                 # Python FastAPI 推理服务
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # 路由、跨域、入参校验
│   │   └── detector.py          # 模型加载（单例缓存）与结果解析
│   ├── models/yolo11n.pt        # 官方权重（提交）
│   ├── test_images/             # bus.jpg(测 person)、naruto_t1.png(测自训练模型)
│   ├── train/
│   │   ├── train3.py            # 原训练脚本（阶段1.5 改路径后重跑）
│   │   ├── bvn.yaml             # 数据集配置
│   │   └── dataset/{images,labels}/{train,val}/
│   └── requirements.txt
├── server/                      # SpringBoot（阶段2，空）
└── web/                         # Vue3（阶段4，空）
```

## 6. 本机环境（已核实 2026-09-17）

- Git 2.55 ✓；Node v22.23.2 / npm 10.9.8 ✓（阶段4用）
- Python：统一用 conda 环境 **hbkjyolo**（Python 3.11.15）
  - 解释器路径：`D:\yolo_project\Miniconda_install\envs\hbkjyolo\python.exe`
  - 已装：torch 2.13.0、torchvision 0.28.0、ultralytics 8.3.86（可编辑安装指向 D:\yolo_project\ultralytics-8.3.86，**勿删除该目录**）、opencv 4.10、numpy 2.1.1、pillow 12.3
  - 阶段1补装：fastapi、uvicorn、python-multipart
- **未安装**：JDK、Maven（阶段2前安装，JDK 17 + Maven，或用 IDEA 自带 Maven）
- 注意：系统里另有 Python 3.14/3.13 与 conda base 3.8，本项目一律不用，避免 torch 兼容问题。

## 7. 当前进度与下一步

- [x] 阶段0：源码梳理、资产复制、仓库初始化
- [x] 阶段1：FastAPI 推理服务（app/main.py + app/detector.py）。已装 fastapi0.141/uvicorn0.53；验收：/health 通过，bus.jpg 返回 1 bus + 4 person（conf 0.62~0.94），字段完整
- [ ] 阶段1.5：修正数据集划分（当前 val 是 train 的复制，按帧段重新划分）→ 重跑训练得 best.pt 与新评估图 → 用 model_name=best.pt 验证 naruto_t1.png
- [ ] 阶段2：SpringBoot（收图、转发 ai-platform、统一响应、CORS）
- [ ] 阶段3：MySQL + MyBatis-Plus 检测记录落库
- [ ] 阶段4：Vue3 前端（上传、Canvas 画框、历史记录）
- [ ] 阶段5：三端联调、截图、简历定稿

## 8. Git 规范

- 每完成一个可运行里程碑提交一次；提交前 `git status` / `git diff` 审查 AI 改动
- message 风格：`feat: 新增YOLO推理FastAPI服务` / `fix: ` / `docs: ` / `chore: `
- .gitignore 已忽略 __pycache__、*.cache、runs/、target/、node_modules/、.idea/、*.mp4
- 权重与数据集提交，保证 clone 可运行

## 9. 简历素材（华清远见段，随项目推进更新）

- AI 辅助开发：以自然语言拆解任务驱动 AI 生成多语言代码（C/Python/Java/Vue），本人负责契约设计、代码审查、跨端联调与报错定位
- 推理服务：基于 YOLO11n 预训练模型封装 FastAPI 推理服务，HTTP 接收图片、内存推理、返回结构化检测结果
- 训练流程：完成 82 帧游戏画面两类目标（鸣人/带土）YOLO 标注，基于 yolo11n 完成 50 轮迁移训练；**主动发现原验证集与训练集重复问题并重新划分**（阶段1.5后可写）
- Web 重构：SpringBoot 业务编排 + Python AI 服务异构协作 + Vue 前端 Vibe Coding

## 10. 面试预案要点

1. mAP 为什么高/为什么重做划分：两类目标、同源抽帧、原 val 与 train 重复 → 指标虚高；重构时按视频时段重新划分，泛化评估才可信
2. YOLO 标注格式：每行 `class cx cy w h`（归一化中心点+宽高）
3. 为什么 Java/Python 分服务：AI 生态在 Python，业务生态在 Java，HTTP 解耦、各自独立部署
4. Vibe Coding 中本人的角色：架构与契约设计、任务拆解、生成代码审查、验收与排错（能现场讲任意模块数据流）
5. 原 socket 协议：4 字节小端文件长度头 + 图片二进制流；为什么换 HTTP：浏览器无法直接对接私有 TCP、HTTP 多端可用、生态成熟

## 11. 新对话交接话术

> 先阅读 docs/PROJECT_CONTEXT.md 和 README.md，再用 git log 查看提交历史，确认当前进度和待办后继续；有歧义先问我，不要自行改架构和接口契约。
