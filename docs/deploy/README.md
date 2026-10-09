# 部署说明（前端静态导出 + Nginx 反向代理）

本文档介绍如何在本机把三端跑起来，以及如何用 Nginx 托管 Next.js 静态导出的生产版本。
配置文件见同目录 [`nginx.conf`](./nginx.conf)。

## 1. 架构与端口

```
浏览器
  │  http://localhost  (80)
  ▼
Nginx ── 静态页面 ──▶ web/out（Next.js 静态导出产物）
  │
  ├─ /api、/uploads ─────────────▶ SpringBoot 业务服务 (8080)
  │                                    │
  │                                    └─ 目标检测时调用 ▶ FastAPI / YOLO (8000)
  └─ /api/device/stream (SSE 长连接) ▶ SpringBoot (8080)

SpringBoot ──▶ MySQL (3306，库名 smarthome)
```

| 服务 | 技术栈 | 端口 | 说明 |
| --- | --- | --- | --- |
| AI 推理 | FastAPI + Uvicorn + YOLOv11 | 8000 | 目标检测，模型单例缓存 |
| 业务后端 | SpringBoot 3 + MyBatis-Plus + MySQL | 8080 | REST 接口、SSE 遥测、风扇控制、检测记录 |
| 前端（开发） | Next.js dev server | 3000 | 仅开发用，`/api` 自动代理到 8080 |
| 前端（生产） | Nginx 托管 `out/` | 80 | 静态页面 + 反向代理 |
| 数据库 | MySQL 8 | 3306 | 库名 `smarthome` |

## 2. 前置环境

- JDK 17、Maven 3.8+
- Node.js 18+（推荐 20/22）、npm
- Python 3.10+ 虚拟环境（含 `ultralytics`、`fastapi`、`uvicorn` 等，见 `ai-platform/requirements.txt`）
- MySQL 8（创建库 `smarthome`，表由后端自动建/更新）
- Nginx（Windows 绿色包解压即可；Linux 用包管理器安装）

数据库连接等敏感配置通过本地配置文件或环境变量注入，**不要把数据库密码提交到仓库**：

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/smarthome?...
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=你的密码
```

## 3. 开发模式（三端各开一个终端）

```bash
# 1) AI 推理服务（先激活你的 Python 虚拟环境）
cd ai-platform
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2) 业务后端（需已设置 JAVA_HOME 指向 JDK 17）
cd server
mvn spring-boot:run

# 3) 前端开发服务器
cd web
npm install
npm run dev        # 访问 http://localhost:3000
```

开发模式下 `next.config.mjs` 已把 `/api`、`/uploads` 代理到 `http://localhost:8080`，无需 Nginx。

> 开发模式首次切换到「设备监控」等页面会略卡，是 Next.js 在按需现场编译（该页含 ECharts，体积最大）；
> 切换过一次后会变快。**这是 dev 模式的固有现象，生产构建（第 4 节）后为预编译产物，切换近瞬时。**

## 4. 生产构建与 Nginx 部署（推荐的演示/验收方式）

### 4.1 构建前端静态产物

```bash
cd web
npm run build
```

构建会自动执行 `prebuild` 钩子：

1. `scripts/genAntdCss.cjs` 把 antd 组件样式**烘焙成一份静态 CSS**（`app/antd.min.css`，该文件被 gitignore，不提交）；
2. `next build` 以 `output: 'export'` 把整站静态导出到 `web/out/`（纯 HTML/CSS/JS，无需 Node 进程常驻）。

### 4.2 配置并启动 Nginx

1. 复制 `docs/deploy/nginx.conf` 到 Nginx 的配置目录（Windows 绿色包为 `conf/nginx.conf`；Linux 通常为 `/etc/nginx/nginx.conf` 或 `/etc/nginx/conf.d/`）。
2. 按需修改两处：
   - `root`：指向 **web/out 的绝对路径**（路径用正斜杠 `/`）；
   - `proxy_pass` 的 `127.0.0.1:8080`：后端在其他机器时改成对应地址。
3. 启动 / 重载 / 停止：

```bash
# Windows（在 Nginx 解压目录下执行）
start nginx            # 启动（也可双击 nginx.exe）
nginx -s reload        # 修改 nginx.conf 后重载
nginx -s stop          # 停止

# Linux
sudo nginx
sudo nginx -s reload
sudo systemctl restart nginx
```

4. 让后端与 AI 服务保持运行（生产可用 jar / 进程守护方式）：

```bash
# 业务后端打包为 jar 后运行
cd server && mvn -DskipTests package
java -jar target/smart-home-server-*.jar

# AI 服务同第 3 节，用 uvicorn 常驻
```

5. 浏览器访问 **http://localhost** 即可。

> 上 Linux 云服务器时思路相同：把 `out/`、jar、AI 服务分别放到服务器，用 Nginx 托管静态文件并反代到本机 8080；
> jar 与 uvicorn 可用 `systemd` 配成开机自启的服务。本项目当前为**本机部署实践**。

## 5. Nginx 关键配置说明

- **gzip**：对 JS/CSS（含 ECharts）开启压缩，传输体积约下降 2/3。
- **`/_next/static/` 强缓存**：文件名带内容 hash，设置 `expires 1y; immutable`，发版后 hash 变化会自动拉新。
- **SSE 关闭缓冲**：`/api/device/stream` 必须设置 `proxy_buffering off; proxy_cache off;` 并拉长 `proxy_read_timeout`，
  否则 Nginx 会把实时遥测数据攒批，前端看不到每 2 秒的刷新。
- **前端路由回退**：静态导出为扁平 `.html`，用 `try_files $uri $uri.html $uri/ /index.html;` 保证刷新/直达 `/device`、`/records` 不 404。
- **`/api/`、`/uploads/` 反向代理**：前端只与 Nginx 同源通信，避免跨域，后端与 AI 服务不直接暴露。

## 6. 常见问题

- **改了前端代码，刷新页面没变化？** 生产模式托管的是 `out/`，改完代码需重新 `npm run build`；
  静态文件更新后浏览器刷新即可（HTML 不做强缓存），**只有改了 `nginx.conf` 才需要 `nginx -s reload`**。
- **首屏短暂出现无样式的裸 HTML（FOUC）？** antd 样式必须在构建前烘焙。确认 `npm run build` 日志里出现
  `[genAntdCss] env=production ... menu=true card=true table=true`，且 `out/index.html` 的 `<head>` 里有
  指向 `_next/static/css/*.css` 的 `<link rel="stylesheet">`。若以后新增了 antd 组件而该组件缺样式，
  把它补进 `scripts/genAntdCss.cjs` 的渲染清单后重新构建。
- **设备数据不实时刷新？** 检查 Nginx 是否对 SSE 路径关闭了缓冲（见 5），以及 8080 服务是否在线。
- **检测接口报错？** 确认 8000（AI）与 8080（业务）都已启动；业务服务健康检查为 `http://localhost:8080/api/health`，
  AI 服务文档为 `http://localhost:8000/docs`。
