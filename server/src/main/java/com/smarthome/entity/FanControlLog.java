package com.smarthome.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 风扇控制日志实体，对应表 fan_control_log。
 * 每次经 REST 下发风扇指令落一条，用于审计/追溯。
 */
@TableName("fan_control_log")
public class FanControlLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 设备 ID，关联 device.id */
    private Long deviceId;

    /** 风扇开关：1 开 0 关 */
    private Integer power;

    /** 档位：0 关 1 半速 2 全速 */
    private Integer speed;

    /** 指令来源：MANUAL 手动 / AUTO 自动联动 */
    private String source;

    /** 数据库默认 CURRENT_TIMESTAMP 自动填充，插入时不写该列 */
    @TableField(insertStrategy = FieldStrategy.NEVER)
    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(Long deviceId) {
        this.deviceId = deviceId;
    }

    public Integer getPower() {
        return power;
    }

    public void setPower(Integer power) {
        this.power = power;
    }

    public Integer getSpeed() {
        return speed;
    }

    public void setSpeed(Integer speed) {
        this.speed = speed;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
