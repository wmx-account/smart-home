# Smart Home Web（前端）

智能家居边缘智能系统的 Web 前端，提供 YOLO 目标检测、设备实时监控与检测历史。

## 技术栈

- [Next.js 14](https://nextjs.org/)（App Router）+ React 18
- [Ant Design 5](https://ant.design/) 组件库 + `@ant-design/nextjs-registry`（SSR 样式注入）
- [ECharts 6](https://echarts.apache.org/) 实时仪表盘 / 历史趋势曲线
- axios 请求封装
- **静态导出**（`output: 'export'`）：构建产物为纯静态文件 `out/`，可直接交由 Nginx 托管

## 目录结构

```
web/
├── app/                    # App Router 路由
│   ├── page.jsx            # /        目标检测
│   ├── device/page.jsx     # /device  设备实时监控（SSE）
│   ├── records/page.jsx    # /records 检测历史
│   ├── layout.jsx          # 全局布局（头部导航 / 状态灯 / 页脚）
│   ├── providers.jsx       # antd 中文、主题与消息桥
│   └── globals.css         # 全局样式
├── components/
│   ├── Shell.jsx           # 顶部导航 + 双服务健康灯
│   ├── EChart.jsx          # ECharts 通用封装（自适应 / 卸载销毁）
│   ├── ResultImage.jsx     # 检测结果百分比画框
│   ├── detect/             # 目标检测页
│   ├── device/             # 设备监控页（仪表盘 / 趋势 / 风扇 / 记录）
│   └── records/            # 检测历史页
└── lib/                    # axios 实例、接口封装、图表配置与工具函数
```

## 本地开发

前置：后端业务服务（SpringBoot，`:8080`）与 AI 推理服务（FastAPI，`:8000`）已启动。

```bash
npm install
npm run dev        # http://localhost:3000
```

开发模式下通过 `next.config.mjs` 的 `rewrites` 把 `/api`、`/uploads` 代理到 `http://localhost:8080`，无需额外跨域配置。

## 构建与部署

```bash
npm run build      # 生成静态产物 out/
```

静态导出只预生成页面外壳，浏览器加载后仍是完整 React 应用，SSE 实时推送、定时轮询与接口调用均不受影响。生产环境把 `out/` 交由 Nginx 托管，并由 Nginx 反向代理 `/api`、`/uploads`（`:8080`）；其中 SSE 路径需关闭 `proxy_buffering` 并设置较长的读超时。

## 页面与接口

| 页面 | 功能 | 主要接口 |
| --- | --- | --- |
| 目标检测 | 上传图片、置信度阈值、画框与目标明细 | `POST /api/detect`、检测记录 |
| 设备监控 | 温湿度 / 光照实时仪表盘、历史趋势、风扇控制 | SSE `/api/device/stream`、`POST /api/device/fan` 等 |
| 检测历史 | 记录分页、缩略图、详情画框 | `/api/records` |
