package com.smarthome.device;

import com.smarthome.vo.DeviceSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE 连接管理与遥测广播。
 *
 * 为什么用 SSE 而不是 WebSocket：本场景只有「服务器 → 浏览器」的单向高频推送，
 * 风扇控制等上行指令走 REST（一问一答、有状态码、好重试）。SSE 基于普通 HTTP，
 * 浏览器原生 EventSource 自带断线重连，无需自己维护心跳与会话。
 *
 * 多个浏览器页签会建立多条连接，用线程安全的 CopyOnWriteArrayList 持有，
 * 调度线程每 2s 向所有连接广播一次快照。
 */
@Component
public class DeviceSseManager {

    private static final Logger log = LoggerFactory.getLogger(DeviceSseManager.class);

    private final DeviceGateway gateway;

    /** 当前所有 SSE 连接；读多写少（连接/断开少、广播多），适合 COW 列表 */
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public DeviceSseManager(DeviceGateway gateway) {
        this.gateway = gateway;
    }

    /** 新连接：注册回调、立即推一帧（前端不必干等第一个 2s 周期） */
    public SseEmitter connect() {
        SseEmitter emitter = new SseEmitter();   // 超时由 spring.mvc.async.request-timeout=-1 控制
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            emitter.complete();
        });
        emitter.onError(e -> emitters.remove(emitter));
        try {
            emitter.send(SseEmitter.event()
                    .name("telemetry")
                    .data(gateway.snapshot(), MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    /** 每 2s 广播一次；写失败的连接（客户端关闭/网络断）剔除 */
    @Scheduled(fixedRateString = "${device.push.interval-ms:2000}", initialDelay = 1000)
    public void broadcast() {
        if (emitters.isEmpty()) {
            return;
        }
        DeviceSnapshot snapshot = gateway.snapshot();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("telemetry")
                        .data(snapshot, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                log.debug("SSE 连接已关闭，移除：{}", e.getMessage());
                emitters.remove(emitter);
                try {
                    emitter.complete();
                } catch (Exception ignored) {
                    // 忽略重复 complete
                }
            }
        }
    }
}
