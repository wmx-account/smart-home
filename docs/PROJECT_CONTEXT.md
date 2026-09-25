# 项目交接手册（PROJECT_CONTEXT）

> 本文件是项目的唯一权威上下文。任何新对话 / 新 Agent / 新设备接手时，**先读本文件和 README，再看 `git log`**，然后按"当前进度与下一步"继续。每完成一个阶段必须更新本文件并提交。
> 最近更新：2026-09-22，**阶段 6a 设备实时监控线完成**：device/fan_control_log 两张表、Mock 设备物理模型、SSE 遥测推送、REST 风扇控制、ECharts 设备监控 Tab，三端联调与截图（05/06）通过。2026-09-23 微调：仪表盘标题间距拉开、温湿度变化调慢到分钟级（温度逼近系数 0.18→0.05）并重拍 05/06。2026-09-24 再调：切换风扇加 3s 热惯性延迟（前 3s 不变）、温度系数 0.05→0.03 更缓慢、光照去噪声保持稳定，仪表盘改为「弧在上 / 数值与标题下移」三层分离，重拍 05/06。此前 2026-09-18 阶段 1-5 完成（AI 视觉检测线三端联调、前端美化）。best.pt 重训、Redis、阶段6b 时序入库/历史曲线、LLM Agent 线为「未做/暂缓项」。

---

## 1. 项目背景与定位

- 项目名：Smart Home（智能家居边缘智能系统 Web 化重构版）
- 起源：华清远见毕业实习项目，原形态为 STM32 + Linux C 网关 + Qt 上位机 + Python(YOLO) 的边缘智能系统。
- 重构动机：原上位机为 Qt 单机程序、Python 端用原生 socket 私有二进制协议通信、仅桌面端可用；为支持浏览器访问与前后端分离部署，重构为 Web 系统，并以 AI 辅助编程（Vibe Coding）方式完成三端开发。


## 2. 目标架构（四层）

```
① 采集接入层  STM32 + Linux C 网关（Modbus TCP / TCP 转发）—— 原项目资产，仅背景描述，本次不重构
② 业务服务层  server/  SpringBoot(Java)：收图、编排调用 AI 服务、检测记录入库、结果回传（阶段2）
③ AI 推理层  ai-platform/  FastAPI(Python) + YOLO11：人物目标检测，返回框坐标/类别/置信度（阶段1）
④ 展示层      web/  Vue3 + Vite + Element Plus：上传、图片叠加层画检测框、历史记录分页/详情（阶段4已完成）
```

数据流：浏览器(5173) 上传图片 → Vite 代理 /api → SpringBoot(8080) `POST /api/detect` → HTTP 转发 Python(8000) `POST /detect` → YOLO 推理 → 结构化 JSON 原路返回 → 前端把坐标归一化百分比，在图片上叠加 div 检测框。

**设备线（阶段6a）**：`MockDeviceGateway` 用 `@Scheduled` 每 2s（device.mock.tick-ms）推进内存物理模型——切换风扇后先有 **3s 热惯性延迟**（前 3s 温湿度完全不变），之后温度按档位向目标值**缓慢**指数逼近（关机→26℃、半速→22℃、全速→18℃，每 2s 逼近系数 0.03、约 3~5 分钟趋稳）+±0.05 噪声，湿度随温度反向缓慢逼近（系数 0.03、目标 55+(26-温度)*1.5、±0.3 噪声、钳 30~90%），光照只按昼夜时刻正弦（6~18 点，室内基底 100lux、峰值约 980lux，**无随机噪声**、钳 0~1000，切换风扇时光照保持稳定）；`DeviceSseManager` 持 `CopyOnWriteArrayList<SseEmitter>`，连接即推一帧、之后每 2s（device.push.interval-ms）广播事件名 `telemetry`。风扇控制走 REST `POST /api/device/fan`，DeviceService 校验档位→调网关→写 fan_control_log。`DeviceGateway` 是适配器接口，`@ConditionalOnProperty(device.gateway.type=mock/tcp)` 切换，将来加 TcpModbusGateway 接 STM32 时业务/前端/库表零改动。

## 3. 接口契约（三层共用，改动需三方同步）

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

### Java 业务层接口（前端只对接这里，端口 8080）
- `POST /api/detect`（multipart）：字段 `file`、`modelName`（默认 yolo11n.pt）、`conf`（默认 0.25）；内部 RestClient 转发 AI 服务，**成功后保存图片到 uploads/ 并向 detect_record 表落一条记录**。返回 `data: {recordId, imageUrl:"/uploads/年月/xxx.jpg", detect:{...AI 的 data...}}`（阶段3起结构变化，前端按此对接）。
- `GET /api/records?pageNum=1&pageSize=10`：检测历史分页（时间倒序），返回 `{total,pageNum,pageSize,pages,list}`；列表不含 resultJson 大字段。
- `GET /api/records/{id}`：检测详情，含完整 resultJson（Mapper 手写 `@Select("SELECT * ...")`，绕过实体 `@TableField(select=false)`）。
- `GET /uploads/**`：上传图片静态资源映射（file:./uploads/，须在 server/ 目录启动）。
- 设备线（阶段6a，前缀 `/api/device`）：
  - `GET /status`：返回当前 `DeviceSnapshot`（字段 deviceId/temperature/humidity/light/fanPower/fanSpeed/online/ts，温度℃、湿度%、光照lux、ts 毫秒），页面首屏立即加载一帧。
  - `POST /fan`：JSON body `{power:Boolean(必传), speed:0|1|2}`，`@Valid`（power `@NotNull`、speed `@Min0@Max2`，校验失败由 GlobalExceptionHandler 的 MethodArgumentNotValidException 处理器返回 **HTTP 400** + 首条字段中文提示）；开机 speed 必须 1 或 2，否则 BusinessException 400；关机 speed 强制 0；成功后写 `fan_control_log(source=MANUAL)` 并返回最新快照。
  - `GET /stream`：produces=`text/event-stream`，返回 SseEmitter；连接成功立即推一帧，之后 `@Scheduled` 每 2s 广播，SSE 事件名 `telemetry`、data 为 DeviceSnapshot JSON；靠 `spring.mvc.async.request-timeout=-1` 关闭默认 30s 超时（否则 EventSource 被反复断开）。
- `GET /api/health`：返回自身状态并探活下游 ai-platform。
- 在线接口文档：`http://127.0.0.1:8080/swagger-ui/index.html`（springdoc，对标 FastAPI /docs）。
- 统一响应 `{code,msg,data}`；全局异常：空文件/非图片 400、记录不存在 404、AI 服务连不通 503、文件超限 400。

### 前端（web/，Vite dev server 端口 5173）
- 开发态浏览器只访问 5173；`vite.config.js` 把 `/api`、`/uploads` 代理到 8080（解决跨域、避免硬编码后端地址）；后端 CORS 同时保留。
- 页面：`App.vue` 渐变标题栏（含两个后端服务在线状态徽章，getHealth 每 15s 轮询）+ 两个 Tab（目标检测 / 检测历史）+ 页脚；`components/DetectPanel.vue`（左右分栏：el-upload 拖拽上传 + el-slider 置信度阈值；结果卡含「关闭图片」按钮回到空状态、el-descriptions 元信息、可点击高亮的目标明细列表）、`ResultImage.vue`（画框核心，支持 activeIndex 高亮/淡化）、`RecordTable.vue`（三个 el-statistic 统计卡 + 刷新按钮 + el-table 分页 + 详情弹窗）。
- `api/request.js`：axios 实例 + 响应拦截器（解包 `{code,msg,data}`、统一 ElMessage 报错）；`api/detect.js`：detectImage(FormData)/getRecords/getRecordDetail/getHealth。
- 图标用 `@element-plus/icons-vue`（main.js 全量注册）；`npm run build` 通过（1641 模块），有主包 >500KB 警告，源于 Element Plus 全量引入，生产可按需引入/代码分割（gzip 后约 377KB）。
- 画框：相对定位容器 + 绝对定位 div，`left/top/width/height = 坐标/原图宽高 × 100%`，按 cls_idx 取色；非 Canvas（需求仅展示，div 更简单、响应式好）。
- 设备监控 Tab（阶段6a，App.vue 第三个 Tab「设备监控」name=device、图标 Odometer，顺序在目标检测与检测历史之间）：`api/device.js` 封装 getDeviceStatus/controlFan（SSE 不走 axios，导出流地址常量 DEVICE_STREAM_URL）；`DevicePanel.vue` 用 **ECharts** 三个 gauge（温度 10~40℃、湿度 0~100%、光照 0~1000lx；弧与指针在上，数值 detail 与标题 title 偏移到弧下方、三层不重叠，图表高 300px），`new EventSource('/api/device/stream')` 监听 `telemetry` 事件 setOption 刷新，`error` 时依赖浏览器原生自动重连并显示"重连中…"（onUnmounted 时 es.close()、chart.dispose()、移除 window resize 监听）；风扇 el-switch（开关）+ el-radio-group（半速 1/全速 2，关机禁用档位），@change 调 REST，失败重新 GET /status 回滚 UI；顶部 SSE 连接状态徽章 + 最后更新时间。echarts 经 npm 安装，`npm run build` 通过（2237 模块，主包约 2.3MB/gzip 753KB，体积警告源于 echarts+Element 全量引入，后续可按需引入/代码分割）。

## 4. 目录结构

```
Smart Home/
├── .gitignore
├── README.md                    # 三端启动说明（阶段推进中补全）
├── docs/
│   ├── PROJECT_CONTEXT.md       # 本文件（公开脱敏版）
│   ├── screenshots/             # 联调截图（01空状态/02结果/03历史/04详情画框/05设备监控/06风扇闭环）
│   └── train-result/            # 原项目训练评估图、results.csv（佐证材料）
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
├── server/                      # SpringBoot 3.3.5 + Java 17 + MyBatis-Plus 3.5.9
│   ├── pom.xml
│   ├── uploads/年月/uuid.jpg     # 检测图片（gitignore，不提交）
│   └── src/main/
│       ├── java/com/smarthome/
│       │   ├── SmartHomeApplication.java        # 启动类
│       │   ├── common/   ApiResponse / BusinessException / GlobalExceptionHandler（含 @Valid → 400）
│       │   ├── config/   RestClientConfig / WebConfig(CORS+静态资源) / MybatisPlusConfig(分页) / SchedulingConfig(@Scheduled 线程池)
│       │   ├── client/   AiDetectClient（RestClient 转发 multipart）
│       │   ├── device/   DeviceGateway(适配器接口) / MockDeviceGateway(物理模型+条件装配) / DeviceSseManager(SSE 广播)
│       │   ├── entity/   DetectRecord / Device / FanControlLog
│       │   ├── mapper/   DetectRecordMapper（+selectDetailById） / DeviceMapper / FanControlLogMapper
│       │   ├── dto/      FanControlRequest（@Valid 风扇开关/档位校验）
│       │   ├── service/  DetectService(编排) / RecordService(落库/分页/详情) / FileStorageService / DeviceService(状态/控制/落日志)
│       │   ├── vo/       DetectResultVO（recordId/imageUrl/detect） / DeviceSnapshot(遥测快照)
│       │   └── controller/ DetectController（detect、records、health） / DeviceController（status、fan、stream-SSE）
│       └── resources/
│           ├── application.yml        # 端口/数据源(无密码)/MP/springdoc/上传目录（提交）
│           ├── application-local.yml  # 数据库密码（gitignore，不提交）
│           └── db/schema.sql          # 建库建表脚本（提交）
├── web/                         # Vue3 + Vite8 + Element Plus（阶段4完成、阶段5美化）
│   ├── package.json             # vue3.5 / element-plus2.14 / icons-vue2.3 / axios1.20 / echarts（node_modules、dist 不提交）
│   ├── vite.config.js           # dev 端口5173 + /api、/uploads 代理到8080
│   ├── index.html
│   └── src/
│       ├── main.js              # 全量注册 Element Plus（中文语言包）与图标
│       ├── App.vue              # 渐变标题栏 + 服务状态轮询 + 两 Tab + 页脚
│       ├── style.css
│       ├── api/request.js       # axios 实例 + 响应拦截器
│       ├── api/detect.js        # 检测线接口封装（FormData 上传/分页/详情/健康）
│       ├── api/device.js        # 设备线：getDeviceStatus/controlFan + SSE 流地址常量
│       └── components/
│           ├── DetectPanel.vue  # 拖拽上传 + 阈值滑块 + 结果 + 关闭图片 + 目标明细高亮
│           ├── ResultImage.vue  # 坐标归一化画框（核心，支持高亮/淡化）
│           ├── RecordTable.vue  # 统计卡片 + 刷新 + 历史表格 + 分页 + 详情弹窗
│           └── DevicePanel.vue  # ECharts 三仪表盘 + EventSource(SSE/自动重连) + 风扇开关档位
```

## 5. 本机环境（已核实 2026-09-17）

- Git 2.55 ✓
- **Node.js v24.19.0 / npm 11.17.0**（winget 安装，node 本体在 `D:\vs code\node.exe`，因旧注册表 InstallPath 指向该目录）；npm 全局目录 `D:\nodejs\npm-global`、缓存 `D:\nodejs\npm-cache`（D 盘，配置写在 `C:\Users\王\.npmrc`，registry=淘宝镜像）；PowerShell 当前用户执行策略已设 RemoteSigned（否则 npm.ps1 被拦）；启动前端 `cd web; npm run dev`（node_modules 不提交，clone 后先 `npm install`）
- Python：统一用 conda 环境 **hbkjyolo**（Python 3.11.15）
  - 解释器路径：`D:\yolo_project\Miniconda_install\envs\hbkjyolo\python.exe`
  - 已装：torch 2.13.0、torchvision 0.28.0、ultralytics 8.3.86（可编辑安装指向 D:\yolo_project\ultralytics-8.3.86，**勿删除该目录**）、opencv 4.10、numpy 2.1.1、pillow 12.3
  - 阶段1补装：fastapi、uvicorn、python-multipart
- JDK 17：复用 IDEA 自带 JBR 17.0.9（含 javac），已设用户级 JAVA_HOME=`D:\web应用程序设计与开发课程\IntelliJ IDEA 2023.3.2\jbr`（后续可换独立 Temurin 17）
- Maven 3.9.9：`D:\apache-maven-3.9.9-bin\apache-maven-3.9.9`，已设 MAVEN_HOME/PATH；用户级 `C:\Users\王\.m2\settings.xml` 已配阿里云镜像（mirrorOf=*，含 JDK-1.8 默认 profile，pom 已显式锁 17 不受影响）
- **Maven 本地仓库已迁到纯英文路径 `D:/m2/repository`**（settings.xml 中 `<localRepository>` 指定；旧 `C:\Users\王\.m2\repository` 309MB 保留未删，稳定后可删）。原因见阶段2踩坑：中文用户名导致 spring-boot:run 类路径乱码
- 启动 Java 服务：`cd server; mvn spring-boot:run`（或 java -jar target/smart-home-server-1.0.0.jar，**工作目录须在 server/**，uploads 相对路径才正确）；覆盖 AI 地址：--ai.service.url=...
- **MySQL 8.0.46**：服务名 MySQL80、端口 3306、root 密码 123456；库 smarthome、表 detect_record / device / fan_control_log（后两张为阶段6a 新增），初始化脚本 server/src/main/resources/db/schema.sql；密码只写在 application-local.yml（gitignore）。旧库 testweb 勿动。
- 注意：系统里另有 Python 3.14/3.13 与 conda base 3.8，本项目一律不用，避免 torch 兼容问题。

## 6. 当前进度与下一步

- [x] 阶段0：源码梳理、资产复制、仓库初始化
- [x] 阶段1：FastAPI 推理服务（app/main.py + app/detector.py）。已装 fastapi0.141/uvicorn0.53；验收：/health 通过，bus.jpg 返回 1 bus + 4 person（conf 0.62~0.94），字段完整
- [ ] 阶段1.5（暂缓）：扩充并规范数据集划分 → 重跑训练得 best.pt 自定义权重与新评估图 → 用 model_name=best.pt 验证 naruto_t1.png
- [x] 阶段2：SpringBoot 3.3.5（收图、RestClient 转发 ai-platform、统一响应、全局异常、CORS、健康探活）。验收：mvn package 通过；双服务启动后经 8080 上传 bus.jpg 返回 1 bus+4 person，与直连 8000 一致。**踩坑**：RestClient 默认 JDK HttpClient 发 h2c 升级，uvicorn 不支持导致 POST 文件失败（GET 正常），显式换 SimpleClientHttpRequestFactory(HTTP/1.1) 解决；**坑2（环境）**：`mvn spring-boot:run` 报 NoClassDefFoundError: SpringApplication（编译/package/java -jar 均正常），根因是用户名路径含中文"王"，run 插件子进程类路径编码错乱；用 dependency:build-classpath 导出验证（UTF-8 读取后手动 java -cp 可启动），最终把本地仓库迁到 `D:/m2/repository` 英文路径根治；MAVEN_OPTS=-Dfile.encoding=UTF-8 无效
- [x] 阶段3：MySQL 8 + MyBatis-Plus 3.5.9 检测记录落库。依赖 mybatis-plus-spring-boot3-starter + mybatis-plus-jsqlparser(3.5.9 起分页插件拆包) + mysql-connector-j + springdoc；功能：图片按 年月/UUID 存 uploads/、检测完落库（含推理耗时）、历史分页、详情、静态资源映射、Swagger。验收：两次检测落 2 条（首次 3304ms 含模型加载/二次 159ms 体现单例缓存），分页 total=2 列表无 resultJson，详情 resultJson 540 字符，图片 200(137KB)，swagger 200。**踩坑**：①3.5.9 需单独引 jsqlparser 否则找不到 PaginationInnerInterceptor；②@TableField(select=false) 连 selectById 也排除该列，详情改手写 @Select；③java -jar 占用 target jar 导致 repackage 无法 rename，须先停服务
- [x] 阶段4：Vue3 + Vite8 + Element Plus 前端。功能：el-upload 上传（FormData，可调置信度）、结果图按坐标叠加 div 画框（百分比归一化、按类别配色、标签 cls+conf）、历史 el-table 分页 + 缩略图 + 详情弹窗复现画框、axios 拦截器统一解包/报错、Vite proxy 代理 /api 与 /uploads。验收：三端启动后经 5173 上传 bus.jpg 返回 recordId/5 目标，分页 total 正确，图片经代理 200（137KB），health 链路通
- [x] 阶段5（前端美化 + 收尾）：装 @element-plus/icons-vue；重写 UI（渐变标题栏、服务在线状态 15s 轮询、拖拽上传、置信度滑块、「关闭图片」回空状态、目标明细点击高亮、历史页统计卡与刷新）；`npm run build` 通过；浏览器自动化完成三端联调并归档 4 张截图到 docs/screenshots（空状态/结果/历史/详情画框）；重写根 README（架构图/预览/目录/三端启动/接口表/技术点）。提交 7c48ca9 及本收尾提交
- [x] 阶段6a（设备实时监控线，2026-09-22）：新增 `device`、`fan_control_log` 两表（schema.sql 预置设备 living-room-01/客厅智能主机）；后端 `DeviceGateway` 适配器接口 + `MockDeviceGateway`（AtomicReference 持状态、@Scheduled 物理模型：温度按档位指数逼近闭环、湿度反向、光照昼夜正弦）、`DeviceSseManager`（CopyOnWriteArrayList\<SseEmitter\>，连接即推+每 2s 广播 telemetry）、`SchedulingConfig`（ThreadPoolTaskScheduler poolSize2、前缀 device-sched-）、`DeviceService`（@PostConstruct 按 deviceCode 解析缓存主键、校验档位、写控制日志）、`DeviceController`（GET /status、POST /fan、GET /stream SSE）；GlobalExceptionHandler 补 MethodArgumentNotValidException→HTTP 400；application.yml 加 mvc.async.request-timeout=-1 与 device.* 配置。前端 npm i echarts、api/device.js、DevicePanel.vue（三 gauge + EventSource 原生断线重连 + 开关/半速/全速 + 失败回滚）、App.vue 第三 Tab。验收：curl status 正常；**全速开机后 SSE 温度 26.1→24.6→23.4→22.5→21.8（约 7s，趋向 18℃）、湿度 55.4→56.9 反向升、光照夜间约 90~100lux**；speed=9（@Valid）与开机 speed=0（业务校验）均 HTTP 400 + 中文提示；半速/关机 200；fan_control_log 正确落 2 条、非法请求不落库；经 Vite 代理 SSE 流式正常；浏览器归档截图 05（监控/关机）、06（全速：19.4℃、湿度 60.6%、运行中·全速）。**踩坑**：①PowerShell 给 curl.exe 传 JSON 双引号被吞（Unexpected character 'p'），改 Invoke-RestMethod + ConvertTo-Json；②@Valid 异常原先落兜底返回 500，补专属 @ExceptionHandler 返回 400；③Vite 只绑定 IPv6 `::1:5173`，curl 127.0.0.1 连不上（exit 7），浏览器走 localhost 正常；④常驻服务命令末尾 `| Out-String` 会缓冲实时日志，改靠端口/HTTP 探活判断启动。
- [x] 阶段6a 微调（2026-09-23，应用户验收反馈）：①仪表盘标题（温度/湿度/光照）原与弧底几乎重合，DevicePanel gauge 调整 radius 92%→82%、center 62%→48%、detail offsetCenter 78%→66%、title 102%→112%、图表容器高 240→280px，标题落到弧下方独立位置；②温湿度变化过快，MockDeviceGateway 温度逼近系数 0.18→0.05（每 2s 逼近 5%、约分钟级趋稳）、温度噪声 ±0.08→±0.05，湿度系数 0.10→0.04、噪声 ±0.4→±0.3，光照噪声 ±15→±8。实测：全速 32s 温度 26.0→21.5℃、湿度 55.3→57.1%（对比调慢前 7s 即降到 21.8℃）；重拍截图 05（关机态/标题间距）、06（全速约 40s 降到 20.8℃、运行中·全速）。注：上一条阶段6a 初版验收的「26.1→21.8 约 7s」「06 的 19.4℃」是调慢前旧系数 0.18 的数据，**当前行为一律以系数 0.05 为准**。
- [x] 阶段6a 二次微调（2026-09-24，应用户验收反馈）：①数值原压在 gauge 指针/放射刻度上，DevicePanel 改为 radius 82%→76%、center 48%→38%、detail offsetCenter 66%→124%、title 112%→148%、容器高 280→300px，弧在上、数值与标题下移到弧下方，三层分离；②变化仍偏快且要求“刚切换不变”，MockDeviceGateway 加入 **3s 热惯性延迟**（controlFan 只挂起 pendingTarget + switchAt=now+3000，evolve 在 now<switchAt 时直接返回原状态；到点才把 pendingTarget 转成 targetTemp），温度逼近系数 0.05→0.03、湿度 0.04→0.03；③光照去掉随机噪声、只按 lightNow()，切换风扇时光照保持稳定。实测：开全速 t+2 温度仍 26.0、约 t+4 起每 2s 降约 0.2℃（24s 到 23.7），光照全程 100 不动；全速 45s 温度 25.0→21.6℃；重拍 05/06。**当前行为以「3s 延迟 + 系数 0.03」为准**（前两次验收的快速 / 0.05 数据均为历史）。
- [ ] 阶段6b（用户暂缓）：`sensor_data` 时序表（temperature/humidity/light/create_time + 索引 (device_id,create_time)），2s 照推、每 10s 批量入库（约 8640 行/天；仅留 30 天 + @Scheduled 清理 + 时间桶 GROUP BY 聚合），新增 GET /api/device/sensor?range=1h|1d|7d|30d 与 GET /api/device/fan-logs，前端 ECharts 历史曲线。
- [ ] LLM Agent 线（用户暂缓、方案已定，回来直接做）：在 ai-platform 加 app/agent，形态=**智能家居智能助手/运维 Copilot**（结合智能家居场景，而非孤立的通用文档问答）；LangGraph `create_react_agent` + checkpointer(thread_id 记忆)、Chroma 持久化 + BAAI/bge-small-zh-v1.5 中文向量、RecursiveCharacterTextSplitter(chunk~500/overlap50)，RAG 降级为 Agent 的工具 search_knowledge（知识源 README/API 文档/设备手册/FAQ，返回来源）；另有调 Java REST 的 query_detect_records/get_system_status/预留 get_device_status/control_fan 等工具；FastAPI StreamingResponse 走 SSE，Vue 加助手 Tab（流式 Markdown、工具调用过程折叠、来源）。模型组合 A=阿里百炼 DashScope OpenAI 兼容（qwen-plus 对话/FC + text-embedding-v3 向量，一个 key 有免费额度）；组合 B=DeepSeek（对话/FC 强、便宜，但**无 embedding**）+ 本地 bge，可切 Ollama qwen2.5（http://localhost:11434/v1，小模型 Agent 不稳，开发用云端）；key 写 ai-platform/.env（已 gitignore）。
- 可选优化（按需）：best.pt 自定义权重重训、Redis 结果缓存/限流、Element Plus 与 echarts 按需引入及代码分割、容器化部署。

## 7. Git 规范

- 每完成一个可运行里程碑提交一次；提交前 `git status` / `git diff` 审查 AI 改动
- message 风格：`feat: 新增YOLO推理FastAPI服务` / `fix: ` / `docs: ` / `chore: `
- .gitignore 已忽略 __pycache__、*.cache、runs/、target/、node_modules/、.idea/、*.mp4、application-local.yml（含密码）、server/uploads/（用户图片）
- 权重与数据集提交，保证 clone 可运行
- 密钥/密码不入库：application-local.yml 模式（application.yml 提交非敏感配置，local 覆盖密码）


## 8. 新对话交接话术

> 先阅读 docs/PROJECT_CONTEXT.md 和 README.md，再用 git log 查看提交历史，确认当前进度和待办后继续；有歧义先问我，不要自行改架构和接口契约。
