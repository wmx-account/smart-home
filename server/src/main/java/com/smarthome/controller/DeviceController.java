package com.smarthome.controller;

import com.smarthome.common.ApiResponse;
import com.smarthome.device.DeviceSseManager;
import com.smarthome.dto.FanControlRequest;
import com.smarthome.service.DeviceService;
import com.smarthome.vo.DeviceSnapshot;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 设备接口（阶段6a）：
 * - GET  /api/device/status：查当前遥测快照（REST，页面首次加载）；
 * - POST /api/device/fan   ：风扇开关/档位控制（REST 命令，写控制日志）；
 * - GET  /api/device/stream：SSE 遥测流，服务器每 2s 主动推送温湿度/光照/风扇状态。
 */
@RestController
@RequestMapping("/api/device")
public class DeviceController {

    private final DeviceService deviceService;
    private final DeviceSseManager sseManager;

    public DeviceController(DeviceService deviceService, DeviceSseManager sseManager) {
        this.deviceService = deviceService;
        this.sseManager = sseManager;
    }

    @GetMapping("/status")
    public ApiResponse<DeviceSnapshot> status() {
        return ApiResponse.ok(deviceService.status());
    }

    @PostMapping("/fan")
    public ApiResponse<DeviceSnapshot> controlFan(@Valid @RequestBody FanControlRequest request) {
        return ApiResponse.ok(deviceService.controlFan(request));
    }

    /** SSE 遥测流：produces 必须是 text/event-stream，浏览器用 EventSource 订阅 */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return sseManager.connect();
    }
}
