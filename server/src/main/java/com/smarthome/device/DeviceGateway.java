package com.smarthome.device;

import com.smarthome.vo.DeviceSnapshot;

/**
 * 设备网关抽象（适配器模式）：业务层只依赖这个接口，不关心底层是 Mock 还是真实硬件。
 * 阶段6a 只有 MockDeviceGateway；将来接 STM32/Linux 网关时新增 TcpModbusGateway
 * （读传感器、通过 TCP/Modbus 下发风扇指令），把配置 device.gateway.type 改成 tcp 即可，
 * Controller/Service/前端/数据库都无需改动。
 */
public interface DeviceGateway {

    /** 读取当前遥测快照（温度/湿度/光照/风扇状态） */
    DeviceSnapshot snapshot();

    /**
     * 控制风扇。
     *
     * @param power true 开 / false 关
     * @param speed 档位：0 关 / 1 半速 / 2 全速（关机时传 0）
     * @return 控制后的最新快照
     */
    DeviceSnapshot controlFan(boolean power, int speed);

    /** 设备编码，用于关联 device 表 */
    String getDeviceCode();
}
