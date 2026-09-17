# smart-home-server（Java 业务服务层）

智能家居边缘智能系统的业务编排层。前端只与本服务（8080）通信，本服务通过 HTTP 调用 Python AI 推理服务 ai-platform（8000），并把检测记录落库 MySQL。

## 技术栈

- SpringBoot 3.3.5 + Java 17 + Maven
- MyBatis-Plus 3.5.9（单表 CRUD 免写 SQL、分页插件）
- MySQL 8（数据库 smarthome，表 detect_record）
- springdoc-openapi（在线接口文档 /swagger-ui/index.html）
- 架构：模块化单体（Controller → Service → Mapper/Client 分层），AI 能力由独立 Python 服务 HTTP 提供

## 目录结构

```
src/main/java/com/smarthome/
├── SmartHomeApplication.java        启动类
├── common/      ApiResponse / BusinessException / GlobalExceptionHandler
├── config/
│   ├── RestClientConfig.java        HTTP 客户端（超时、HTTP/1.1，见踩坑记录）
│   ├── WebConfig.java               CORS + /uploads/** 静态资源映射
│   └── MybatisPlusConfig.java       分页插件
├── client/      AiDetectClient       multipart 转发到 Python /detect
├── entity/      DetectRecord         检测记录实体（映射 detect_record 表）
├── mapper/      DetectRecordMapper   继承 BaseMapper + selectDetailById
├── service/
│   ├── DetectService.java            校验→调AI→存图→落库→组装返回
│   ├── RecordService.java            记录落库、分页、详情
│   └── FileStorageService.java       图片按 年月/UUID 存到 uploads/
├── vo/          DetectResultVO       /api/detect 返回结构
└── controller/  DetectController     detect / records / records/{id} / health
src/main/resources/
├── application.yml                   非敏感配置（提交）
├── application-local.yml             数据库密码（gitignore，不提交）
└── db/schema.sql                     建库建表脚本
```

## 启动前准备

1. 启动 Python ai-platform（8000）；
2. MySQL 已运行，执行初始化脚本：
   ```powershell
   mysql -uroot -p < src/main/resources/db/schema.sql
   ```
3. 创建 `src/main/resources/application-local.yml`（不提交），内容：
   ```yaml
   spring:
     datasource:
       password: 你的MySQL密码
   ```

## 启动

```powershell
mvn spring-boot:run          # 工作目录必须在 server/（uploads 为相对路径）
# 或
mvn -DskipTests package
java -jar target/smart-home-server-1.0.0.jar
```

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/detect | multipart：`file`、`modelName`(默认 yolo11n.pt)、`conf`(默认 0.25)；转发 AI、存图、落库，返回 `{recordId,imageUrl,detect}` |
| GET | /api/records | 分页：`pageNum`(默认1)、`pageSize`(默认10)，时间倒序，列表不含 resultJson |
| GET | /api/records/{id} | 检测详情，含完整 resultJson |
| GET | /uploads/** | 上传图片静态访问 |
| GET | /api/health | 自身状态 + 下游 ai-platform 探活 |

接口调试：http://127.0.0.1:8080/swagger-ui/index.html

curl 示例：

```bash
curl -X POST http://127.0.0.1:8080/api/detect \
  -F "file=@../ai-platform/test_images/bus.jpg" \
  -F "modelName=yolo11n.pt" -F "conf=0.25"
```

## 联调记录

- 阶段2（2026-09-17）：经 8080 上传 bus.jpg 返回 1 bus+4 person，与直连 8000 一致。
- 阶段3（2026-09-17）：两次检测成功落库 2 条记录；首次推理 3304ms（含模型加载）、二次 159ms（模型单例缓存）；分页、详情、图片访问（HTTP 200, 137KB）、Swagger 均验证通过。
- 踩坑：
  1. RestClient 默认 JDK HttpClient 发 h2c 升级，uvicorn 不支持导致 POST 文件失败 → 显式用 SimpleClientHttpRequestFactory（HTTP/1.1）；
  2. 中文用户名导致 spring-boot:run 类路径乱码 → Maven 本地仓库迁到纯英文路径；
  3. MyBatis-Plus 3.5.9 起分页插件需单独引 mybatis-plus-jsqlparser；
  4. `@TableField(select=false)` 会让 selectById 也不查该列，详情需手写 `@Select("SELECT * ...")`；
  5. 重新 package 前先停掉 java -jar 进程，否则 jar 被锁，repackage 无法 rename。
