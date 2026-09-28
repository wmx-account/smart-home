package com.smarthome.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.smarthome.common.BusinessException;
import com.smarthome.device.DeviceGateway;
import com.smarthome.entity.Device;
import com.smarthome.entity.SensorData;
import com.smarthome.mapper.DeviceMapper;
import com.smarthome.mapper.SensorDataMapper;
import com.smarthome.vo.DeviceSnapshot;
import com.smarthome.vo.SensorPointVO;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 传感器时序数据业务：定时把当前遥测快照入库、按时间范围做时间桶聚合、定时清理超期数据。
 * SSE 实时推送（每 2s）与历史入库（每 10s）相互独立：前者面向实时仪表盘，后者面向趋势曲线。
 */
@Service
public class SensorDataService {

    private final DeviceGateway gateway;
    private final SensorDataMapper sensorDataMapper;
    private final DeviceMapper deviceMapper;

    @Value("${device.sensor.retention-days:30}")
    private int retentionDays;

    /** 设备表主键，启动时按 deviceCode 解析一次 */
    private volatile Long deviceId;

    public SensorDataService(DeviceGateway gateway,
                             SensorDataMapper sensorDataMapper,
                             DeviceMapper deviceMapper) {
        this.gateway = gateway;
        this.sensorDataMapper = sensorDataMapper;
        this.deviceMapper = deviceMapper;
    }

    @PostConstruct
    public void init() {
        Device device = deviceMapper.selectOne(
                new QueryWrapper<Device>().eq("device_code", gateway.getDeviceCode()));
        this.deviceId = device.getId();
    }

    /** 每 10s 取当前遥测快照落一条（SSE 仍每 2s 推，互不影响） */
    @Scheduled(fixedRateString = "${device.sensor.save-interval-ms:10000}", initialDelay = 5000)
    public void saveCurrent() {
        DeviceSnapshot s = gateway.snapshot();
        SensorData data = new SensorData();
        data.setDeviceId(deviceId);
        data.setTemperature(BigDecimal.valueOf(s.getTemperature()).setScale(2, RoundingMode.HALF_UP));
        data.setHumidity(BigDecimal.valueOf(s.getHumidity()).setScale(2, RoundingMode.HALF_UP));
        data.setLight(BigDecimal.valueOf(s.getLight()).setScale(1, RoundingMode.HALF_UP));
        sensorDataMapper.insert(data);
    }

    /** 按时间范围返回时间桶聚合点，供历史曲线 */
    public List<SensorPointVO> query(String range) {
        long bucket = bucketSeconds(range);
        LocalDateTime since = LocalDateTime.now().minus(duration(range));
        return sensorDataMapper.selectAggregated(deviceId, bucket, since);
    }

    /** 每天 03:05 清理超过保留天数的历史，控制表体积 */
    @Scheduled(cron = "0 5 3 * * ?")
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        sensorDataMapper.delete(new QueryWrapper<SensorData>().lt("create_time", cutoff));
    }

    /** 不同范围用不同桶宽以控制返回点数：1h→1min、1d→15min、7d→1h、30d→6h */
    private long bucketSeconds(String range) {
        if (range == null) {
            return 60;
        }
        switch (range) {
            case "1h": return 60;
            case "1d": return 900;
            case "7d": return 3600;
            case "30d": return 21600;
            default: throw new BusinessException(400, "range 只能为 1h / 1d / 7d / 30d");
        }
    }

    private Duration duration(String range) {
        switch (range) {
            case "1h": return Duration.ofHours(1);
            case "1d": return Duration.ofDays(1);
            case "7d": return Duration.ofDays(7);
            case "30d": return Duration.ofDays(30);
            default: return Duration.ofHours(1);
        }
    }
}
