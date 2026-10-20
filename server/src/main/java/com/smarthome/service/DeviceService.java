package com.smarthome.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
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

        return controlFan(power, speed, "MANUAL");
    }

    /**
     * Agent 规则入口：仅在已识别到人的画面上调用。
     * 当前规则先作为可替换的占位实现：炎热/潮湿开高速风扇，低温关风扇。
     */
    public String applyPersonEnvironmentRule() {
        DeviceSnapshot snapshot = gateway.snapshot();
        double temperature = snapshot.getTemperature() == null ? 0 : snapshot.getTemperature();
        double humidity = snapshot.getHumidity() == null ? 0 : snapshot.getHumidity();

        if (temperature < 16 && Boolean.TRUE.equals(snapshot.getFanPower())) {
            controlFan(false, 0, "AUTO");
            return "温度低于 16℃，已自动关闭风扇";
        }
        if ((temperature > 26 || humidity > 60)
                && (!Boolean.TRUE.equals(snapshot.getFanPower()) || !Integer.valueOf(2).equals(snapshot.getFanSpeed()))) {
            controlFan(true, 2, "AUTO");
            return "检测到人员且环境偏热/潮湿，已自动开启高速风扇";
        }
        return "已检测人员并检查温湿度，当前无需调整风扇";
    }

    private DeviceSnapshot controlFan(boolean power, int speed, String source) {
        DeviceSnapshot snapshot = gateway.controlFan(power, speed);

        FanControlLog log = new FanControlLog();
        log.setDeviceId(deviceId);
        log.setPower(power ? 1 : 0);
        log.setSpeed(speed);
        log.setSource(source);
        fanControlLogMapper.insert(log);

        return snapshot;
    }

    /** 风扇操作历史分页（设备监控页「操作记录」弹窗用），按时间倒序 */
    public IPage<FanControlLog> fanLogs(int pageNum, int pageSize) {
        Page<FanControlLog> page = new Page<>(pageNum, pageSize);
        return fanControlLogMapper.selectPage(page,
                new QueryWrapper<FanControlLog>()
                        .eq("device_id", deviceId)
                        .orderByDesc("create_time"));
    }
}
