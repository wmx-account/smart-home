package com.smarthome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthome.client.AiDetectClient;
import com.smarthome.common.BusinessException;
import com.smarthome.vo.DetectResultVO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 检测业务编排层：校验图片 → 调用 AI 服务 → 保存图片 → 记录入库 → 组装返回。
 */
@Service
public class DetectService {

    private final AiDetectClient aiDetectClient;
    private final FileStorageService fileStorageService;
    private final RecordService recordService;

    public DetectService(AiDetectClient aiDetectClient,
                         FileStorageService fileStorageService,
                         RecordService recordService) {
        this.aiDetectClient = aiDetectClient;
        this.fileStorageService = fileStorageService;
        this.recordService = recordService;
    }

    public DetectResultVO detect(MultipartFile file, String modelName, Double conf) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "图片不能为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException(400, "仅支持 image/* 图片文件");
        }

        long start = System.currentTimeMillis();
        JsonNode resp = aiDetectClient.detect(file, modelName, conf);
        long costMs = System.currentTimeMillis() - start;

        if (resp == null || resp.path("code").asInt(-1) != 0) {
            String msg = resp == null ? "AI 服务无响应" : resp.path("msg").asText("AI 服务返回异常");
            throw new BusinessException(500, msg);
        }
        JsonNode data = resp.path("data");

        // AI 调用成功后：保存原图、落检测记录
        String imagePath = fileStorageService.save(file);
        Long recordId = recordService.save(imagePath, modelName, conf, data, costMs);

        DetectResultVO vo = new DetectResultVO();
        vo.setRecordId(recordId);
        vo.setImageUrl("/" + imagePath);
        vo.setDetect(data);
        return vo;
    }
}
