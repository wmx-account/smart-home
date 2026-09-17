-- Smart Home 数据库初始化脚本
-- 执行方式：mysql -uroot -p < schema.sql
CREATE DATABASE IF NOT EXISTS smarthome
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE smarthome;

-- 目标检测记录表：每次经 Java 服务调用 AI 检测成功后落一条
CREATE TABLE IF NOT EXISTS detect_record (
    id              BIGINT       PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    image_path      VARCHAR(500) NOT NULL COMMENT '图片存储相对路径，如 uploads/202609/xxx.jpg',
    model_name      VARCHAR(64)  NOT NULL COMMENT '模型文件名，如 yolo11n.pt',
    conf_threshold  DOUBLE       COMMENT '置信度阈值',
    object_count    INT          NOT NULL DEFAULT 0 COMMENT '检测到的目标数量',
    image_width     INT          COMMENT '原图宽（像素）',
    image_height    INT          COMMENT '原图高（像素）',
    cost_ms         INT          COMMENT 'AI 推理耗时（毫秒）',
    result_json     TEXT         COMMENT 'AI 返回的完整检测结果 JSON',
    create_time     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
    INDEX idx_create_time (create_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '目标检测记录表';
