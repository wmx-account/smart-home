package com.smarthome.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthome.client.AiDetectClient;
import com.smarthome.common.ApiResponse;
import com.smarthome.service.DetectService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 检测接口：前端只与 Java 服务（8080）通信，Java 内部转发 Python 服务（8000）。
 */
@RestController
@RequestMapping("/api")
public class DetectController {

    private final DetectService detectService;
    private final AiDetectClient aiDetectClient;

    public DetectController(DetectService detectService, AiDetectClient aiDetectClient) {
        this.detectService = detectService;
        this.aiDetectClient = aiDetectClient;
    }

    /**
     * 图片目标检测。
     * 入参与 ai-platform 对齐：file 图片、modelName 模型、conf 置信度阈值。
     */
    @PostMapping("/detect")
    public ApiResponse<JsonNode> detect(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "modelName", defaultValue = "yolo11n.pt") String modelName,
            @RequestParam(value = "conf", defaultValue = "0.25") Double conf) {
        return ApiResponse.ok(detectService.detect(file, modelName, conf));
    }

    /** 业务服务健康检查，同时探活下游 AI 服务 */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("service", "smart-home-server");
        status.put("status", "running");
        try {
            status.put("aiPlatform", aiDetectClient.health().path("data"));
        } catch (Exception e) {
            status.put("aiPlatform", "unavailable: " + e.getMessage());
        }
        return ApiResponse.ok(status);
    }
}
