package com.smarthome.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 传感器时序数据实体，对应表 sensor_data。
 * 设备遥测每 10s 批量落一条，用于历史趋势查询；超期数据由定时任务清理。
 */
@TableName("sensor_data")
public class SensorData {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 设备 ID，关联 device.id */
    private Long deviceId;

    /** 温度（℃） */
    private BigDecimal temperature;

    /** 湿度（%） */
    private BigDecimal humidity;

    /** 光照（lux） */
    private BigDecimal light;

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

    public BigDecimal getTemperature() {
        return temperature;
    }

    public void setTemperature(BigDecimal temperature) {
        this.temperature = temperature;
    }

    public BigDecimal getHumidity() {
        return humidity;
    }

    public void setHumidity(BigDecimal humidity) {
        this.humidity = humidity;
    }

    public BigDecimal getLight() {
        return light;
    }

    public void setLight(BigDecimal light) {
        this.light = light;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
