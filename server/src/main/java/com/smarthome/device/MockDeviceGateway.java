package com.smarthome.device;

import com.smarthome.vo.DeviceSnapshot;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 内置模拟设备网关：在没有 STM32 硬件时，用内存物理模型模拟一台客厅设备。
 * 每 2s 推进一次温湿度/光照，并响应风扇控制，形成「开风扇 → 温度按档位下降」的闭环：
 * 关机温度趋向环境 26℃，半速趋向 22℃，全速趋向 18℃；湿度随温度反向小幅变化；
 * 光照按昼夜变化（仅展示，不参与风扇联动）。
 *
 * 线程安全：{@link #tick()} 跑在调度线程池、{@link #controlFan} 跑在 Tomcat 请求线程，
 * 用 AtomicReference 持有状态，保证一写多读的可见性与安全。
 */
@Component
@ConditionalOnProperty(prefix = "device.gateway", name = "type",
        havingValue = "mock", matchIfMissing = true)
public class MockDeviceGateway implements DeviceGateway {

    private static final String DEVICE_CODE = "living-room-01";

    /** 各档位趋向的目标温度（℃） */
    private static final double ENV_TEMP = 26.0;
    private static final double HALF_TEMP = 22.0;
    private static final double FULL_TEMP = 18.0;

    private final AtomicReference<State> state = new AtomicReference<>(
            new State(ENV_TEMP, 55.0, 0.0, false, 0));

    /** 设备实时状态 */
    private static final class State {
        double temperature;
        double humidity;
        double light;
        boolean fanPower;
        int fanSpeed;

        State(double temperature, double humidity, double light, boolean fanPower, int fanSpeed) {
            this.temperature = temperature;
            this.humidity = humidity;
            this.light = light;
            this.fanPower = fanPower;
            this.fanSpeed = fanSpeed;
        }
    }

    @PostConstruct
    public void init() {
        // 启动即按当前时刻给光照初值，避免首帧为 0
        state.updateAndGet(s -> {
            s.light = lightNow();
            return s;
        });
    }

    /** 每 2s 推进一次物理模型 */
    @Scheduled(fixedRateString = "${device.mock.tick-ms:2000}")
    public void tick() {
        state.updateAndGet(this::evolve);
    }

    private State evolve(State s) {
        ThreadLocalRandom random = ThreadLocalRandom.current();

        // 温度：向当前档位目标值缓慢指数逼近（每 2s 逼近 5%，约分钟级趋稳，贴近真实降温节奏）+ 小幅噪声
        double targetTemp = s.fanPower ? (s.fanSpeed == 2 ? FULL_TEMP : HALF_TEMP) : ENV_TEMP;
        s.temperature = round1(s.temperature + (targetTemp - s.temperature) * 0.05
                + (random.nextDouble() - 0.5) * 0.10);

        // 湿度：随温度反向缓慢变化（降温略增湿），钳制 30~90%
        double targetHumidity = 55.0 + (ENV_TEMP - s.temperature) * 1.5;
        double rawHumidity = s.humidity + (targetHumidity - s.humidity) * 0.04
                + (random.nextDouble() - 0.5) * 0.6;
        s.humidity = clampDouble(rawHumidity, 30.0, 90.0);

        // 光照：昼夜曲线 + 小幅噪声，仅展示
        double rawLight = lightNow() + (random.nextDouble() - 0.5) * 16;
        s.light = clampLong(rawLight, 0.0, 1000.0);
        return s;
    }

    /** 当前时刻光照度（lux）：6~18 点按正弦给日照，夜间保留约 100 lux 室内基础照明 */
    private double lightNow() {
        LocalTime now = LocalTime.now();
        double hour = now.getHour() + now.getMinute() / 60.0;
        double daylight = (hour >= 6 && hour <= 18)
                ? Math.sin(Math.PI * (hour - 6) / 12.0) : 0.0;
        return 100.0 + 880.0 * Math.max(0.0, daylight);
    }

    @Override
    public DeviceSnapshot snapshot() {
        State s = state.get();
        DeviceSnapshot vo = new DeviceSnapshot();
        vo.setDeviceId(DEVICE_CODE);
        vo.setTemperature(s.temperature);
        vo.setHumidity(round1(s.humidity));
        vo.setLight(s.light);
        vo.setFanPower(s.fanPower);
        vo.setFanSpeed(s.fanSpeed);
        vo.setOnline(true);
        vo.setTs(System.currentTimeMillis());
        return vo;
    }

    @Override
    public DeviceSnapshot controlFan(boolean power, int speed) {
        state.updateAndGet(s -> {
            s.fanPower = power;
            s.fanSpeed = power ? speed : 0;   // 关机强制档位归零
            return s;
        });
        return snapshot();
    }

    @Override
    public String getDeviceCode() {
        return DEVICE_CODE;
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double clampDouble(double v, double min, double max) {
        return round1(Math.max(min, Math.min(max, v)));
    }

    private static double clampLong(double v, double min, double max) {
        return (double) Math.round(Math.max(min, Math.min(max, v)));
    }
}
