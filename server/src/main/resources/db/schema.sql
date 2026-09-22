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

-- 设备表：物联网设备/网关登记（阶段6a 预置一台模拟设备 living-room-01）
CREATE TABLE IF NOT EXISTS device (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    device_code  VARCHAR(64)  NOT NULL COMMENT '设备唯一编码，如 living-room-01',
    name         VARCHAR(128) NOT NULL COMMENT '设备名称',
    type         VARCHAR(32)  NOT NULL DEFAULT 'gateway' COMMENT '设备类型：gateway 网关/sensor 传感器',
    online       TINYINT      NOT NULL DEFAULT 1 COMMENT '是否在线：1 在线 0 离线',
    create_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_device_code (device_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '设备表';

-- 风扇控制日志：每次经 REST 下发风扇指令落一条，用于审计/追溯（阶段6a 只写不查，6b 加查询页）
CREATE TABLE IF NOT EXISTS fan_control_log (
    id          BIGINT      PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
    device_id   BIGINT      NOT NULL COMMENT '设备 ID，关联 device.id',
    power       TINYINT     NOT NULL COMMENT '风扇开关：1 开 0 关',
    speed       INT         NOT NULL DEFAULT 0 COMMENT '档位：0 关 1 半速 2 全速',
    source      VARCHAR(16) NOT NULL DEFAULT 'MANUAL' COMMENT '指令来源：MANUAL 手动/AUTO 自动联动',
    create_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '控制时间',
    INDEX idx_device_time (device_id, create_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '风扇控制日志表';

-- 预置一台客厅模拟设备（device_code 唯一键 + INSERT IGNORE，保证脚本可重复执行）
INSERT IGNORE INTO device (device_code, name, type, online)
VALUES ('living-room-01', '客厅智能主机', 'gateway', 1);
