package com.smarthome.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.fasterxml.jackson.databind.JsonNode;
import com.smarthome.client.AiDetectClient;
import com.smarthome.common.ApiResponse;
import com.smarthome.common.BusinessException;
import com.smarthome.entity.DetectRecord;
import com.smarthome.service.DetectService;
import com.smarthome.service.RecordService;
import com.smarthome.vo.DetectResultVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 检测接口：前端只与 Java 服务（8080）通信，Java 内部转发 Python 服务（8000）、落库 MySQL。
 */
@RestController
@RequestMapping("/api")
public class DetectController {

    private final DetectService detectService;
    private final RecordService recordService;
    private final AiDetectClient aiDetectClient;

    public DetectController(DetectService detectService,
                            RecordService recordService,
                            AiDetectClient aiDetectClient) {
        this.detectService = detectService;
        this.recordService = recordService;
        this.aiDetectClient = aiDetectClient;
    }

    /** 图片目标检测：转发 AI、保存图片、记录入库 */
    @PostMapping("/detect")
    public ApiResponse<DetectResultVO> detect(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "modelName", defaultValue = "yolo11n.pt") String modelName,
            @RequestParam(value = "conf", defaultValue = "0.25") Double conf) {
        return ApiResponse.ok(detectService.detect(file, modelName, conf));
    }

    /** 检测历史分页（按时间倒序），列表不含 resultJson 大字段 */
    @GetMapping("/records")
    public ApiResponse<Map<String, Object>> records(
            @RequestParam(value = "pageNum", defaultValue = "1") long pageNum,
            @RequestParam(value = "pageSize", defaultValue = "10") long pageSize) {
        IPage<DetectRecord> page = recordService.page(pageNum, pageSize);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", page.getTotal());
        result.put("pageNum", page.getCurrent());
        result.put("pageSize", page.getSize());
        result.put("pages", page.getPages());
        result.put("list", page.getRecords());
        return ApiResponse.ok(result);
    }

    /** 检测详情（含完整结果 JSON） */
    @GetMapping("/records/{id}")
    public ApiResponse<DetectRecord> recordDetail(@PathVariable Long id) {
        DetectRecord record = recordService.getById(id);
        if (record == null) {
            throw new BusinessException(404, "记录不存在");
        }
        return ApiResponse.ok(record);
    }

    /** 业务服务健康检查，同时探活下游 AI 服务 */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("service", "smart-home-server");
        status.put("status", "running");
        try {
            JsonNode health = aiDetectClient.health();
            status.put("aiPlatform", health.path("data"));
        } catch (Exception e) {
            status.put("aiPlatform", "unavailable: " + e.getMessage());
        }
        return ApiResponse.ok(status);
    }
}
