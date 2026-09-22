package com.smarthome.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.smarthome.common.BusinessException;
import com.smarthome.device.DeviceGateway;
import com.smarthome.dto.FanControlRequest;
import com.smarthome.entity.Device;
import com.smarthome.entity.FanControlLog;
import com.smarthome.mapper.DeviceMapper;
import com.smarthome.mapper.FanControlLogMapper;
import com.smarthome.vo.DeviceSnapshot;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

/**
 * 设备业务层：查询当前遥测快照、处理风扇控制指令并落控制日志。
 * 上行控制走 REST（请求-响应、可校验、可审计），下行遥测走 SSE（见 DeviceSseManager）。
 */
@Service
public class DeviceService {

    private final DeviceGateway gateway;
    private final DeviceMapper deviceMapper;
    private final FanControlLogMapper fanControlLogMapper;

    /** 设备表主键，启动时按 deviceCode 解析一次并缓存（控制日志外键） */
    private volatile Long deviceId;

    public DeviceService(DeviceGateway gateway,
                         DeviceMapper deviceMapper,
                         FanControlLogMapper fanControlLogMapper) {
        this.gateway = gateway;
        this.deviceMapper = deviceMapper;
        this.fanControlLogMapper = fanControlLogMapper;
    }

    @PostConstruct
    public void ensureDevice() {
        String code = gateway.getDeviceCode();
        Device device = deviceMapper.selectOne(
                new QueryWrapper<Device>().eq("device_code", code));
        if (device == null) {
            device = new Device();
            device.setDeviceCode(code);
            device.setName("客厅智能主机");
            device.setType("gateway");
            device.setOnline(1);
            deviceMapper.insert(device);
        }
        this.deviceId = device.getId();
    }

    /** 当前设备遥测快照（前端打开页面首次加载用） */
    public DeviceSnapshot status() {
        return gateway.snapshot();
    }

    /** 风扇控制：校验档位 → 下发网关 → 写控制日志 → 返回最新快照 */
    public DeviceSnapshot controlFan(FanControlRequest request) {
        boolean power = Boolean.TRUE.equals(request.getPower());
        int speed = request.getSpeed() == null ? 0 : request.getSpeed();

        if (power) {
            if (speed != 1 && speed != 2) {
                throw new BusinessException(400, "开机时档位只能为 1（半速）或 2（全速）");
            }
        } else {
            speed = 0;   // 关机强制档位归零
        }

        DeviceSnapshot snapshot = gateway.controlFan(power, speed);

        FanControlLog log = new FanControlLog();
        log.setDeviceId(deviceId);
        log.setPower(power ? 1 : 0);
        log.setSpeed(speed);
        log.setSource("MANUAL");
        fanControlLogMapper.insert(log);

        return snapshot;
    }
}
