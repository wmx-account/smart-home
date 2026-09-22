package com.smarthome.vo;

/**
 * 设备遥测快照：定时通过 SSE 推给前端、也作为 REST 状态/控制接口的返回体。
 * 温度 ℃、湿度 %、光照 lux，风扇开关 + 档位（0 关 / 1 半速 / 2 全速）。
 */
public class DeviceSnapshot {

    /** 设备编码 */
    private String deviceId;

    private Double temperature;

    private Double humidity;

    /** 光照度，单位 lux */
    private Double light;

    /** 风扇开关 */
    private Boolean fanPower;

    /** 风扇档位：0 关 / 1 半速 / 2 全速 */
    private Integer fanSpeed;

    /** 设备是否在线 */
    private Boolean online;

    /** 快照时间戳（毫秒） */
    private Long ts;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Double getLight() {
        return light;
    }

    public void setLight(Double light) {
        this.light = light;
    }

    public Boolean getFanPower() {
        return fanPower;
    }

    public void setFanPower(Boolean fanPower) {
        this.fanPower = fanPower;
    }

    public Integer getFanSpeed() {
        return fanSpeed;
    }

    public void setFanSpeed(Integer fanSpeed) {
        this.fanSpeed = fanSpeed;
    }

    public Boolean getOnline() {
        return online;
    }

    public void setOnline(Boolean online) {
        this.online = online;
    }

    public Long getTs() {
        return ts;
    }

    public void setTs(Long ts) {
        this.ts = ts;
    }
}
