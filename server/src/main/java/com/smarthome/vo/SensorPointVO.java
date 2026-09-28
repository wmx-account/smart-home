package com.smarthome.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 历史趋势聚合点：按时间桶 GROUP BY 得到，供前端 ECharts 折线图。
 */
public class SensorPointVO {

    /** 桶起始时间 */
    private LocalDateTime bucketTime;

    /** 桶内平均温度（℃） */
    private BigDecimal temperature;

    /** 桶内平均湿度（%） */
    private BigDecimal humidity;

    /** 桶内平均光照（lux） */
    private BigDecimal light;

    public LocalDateTime getBucketTime() {
        return bucketTime;
    }

    public void setBucketTime(LocalDateTime bucketTime) {
        this.bucketTime = bucketTime;
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
}
