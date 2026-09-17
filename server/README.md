# smart-home-server（Java 业务服务层）

智能家居边缘智能系统的业务编排层。前端只与本服务（8080）通信，本服务再通过 HTTP 调用 Python AI 推理服务 ai-platform（8000）。

## 技术栈

- SpringBoot 3.3.5 + Java 17 + Maven
- spring-boot-starter-web（Controller、Multipart、RestClient）
- 不使用微服务：模块化单体（Controller → Service → Client 分层），AI 能力由独立 Python 服务提供，HTTP 异构集成

## 目录结构

```
src/main/java/com/smarthome/
├── SmartHomeApplication.java        启动类
├── common/
│   ├── ApiResponse.java             统一响应 {code,msg,data}
│   ├── BusinessException.java       业务异常
│   └── GlobalExceptionHandler.java  全局异常（400/503/500）
├── config/
│   ├── AiServiceProperties.java     ai.service.url 配置绑定
│   ├── RestClientConfig.java        HTTP 客户端（含超时、HTTP/1.1 说明）
│   └── WebConfig.java               CORS 跨域（供阶段4 Vue 调用）
├── client/
│   └── AiDetectClient.java          multipart 转发到 Python /detect
├── service/
│   └── DetectService.java           参数校验 + 业务编排
└── controller/
    └── DetectController.java        POST /api/detect、GET /api/health
src/main/resources/application.yml   端口、上传大小限制、AI 服务地址
```

## 启动方式

先启动 ai-platform（8000），再启动本服务：

```powershell
# 方式一：Maven 直接运行
mvn spring-boot:run

# 方式二：打包后运行
mvn -DskipTests package
java -jar target/smart-home-server-1.0.0.jar

# AI 服务地址非默认时覆盖
java -jar target/smart-home-server-1.0.0.jar --ai.service.url=http://其他地址:8000
```

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/detect | multipart 上传图片：`file`、`modelName`(默认 yolo11n.pt)、`conf`(默认 0.25)，转发 AI 服务并返回检测结果 |
| GET | /api/health | 自身状态 + 下游 ai-platform 探活 |

curl 示例：

```bash
curl -X POST http://127.0.0.1:8080/api/detect \
  -F "file=@../ai-platform/test_images/bus.jpg" \
  -F "modelName=yolo11n.pt" -F "conf=0.25"
```

## 联调记录（2026-09-17）

- 双服务启动，经 8080 上传 bus.jpg，返回 count=5（1 个 bus + 4 个 person，conf 0.62~0.94），与直连 8000 结果一致。
- 踩坑：RestClient 默认底层 JDK HttpClient 会发起 HTTP/2 明文升级（h2c），uvicorn 仅支持 HTTP/1.1，GET 可降级但带文件的 POST 失败（422/连接异常）。定位手段：起临时 FastAPI 回显服务抓 Java 实际发出的 multipart，uvicorn 日志出现 `Unsupported upgrade request`。修复：RestClient 显式指定 `SimpleClientHttpRequestFactory`（HTTP/1.1），并设置连接 5s / 读取 60s 超时。
