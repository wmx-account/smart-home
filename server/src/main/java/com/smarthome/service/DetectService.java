package com.smarthome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthome.client.AiDetectClient;
import com.smarthome.common.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 检测业务编排层：阶段 2 只负责转发 AI 服务；
 * 阶段 3 将在此增加检测记录入库、历史查询等逻辑。
 */
@Service
public class DetectService {

    private final AiDetectClient aiDetectClient;

    public DetectService(AiDetectClient aiDetectClient) {
        this.aiDetectClient = aiDetectClient;
    }

    /** 转发图片到 AI 服务，返回 AI 响应中的 data 节点（检测结果） */
    public JsonNode detect(MultipartFile file, String modelName, Double conf) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "图片不能为空");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException(400, "仅支持 image/* 图片文件");
        }

        JsonNode resp = aiDetectClient.detect(file, modelName, conf);
        if (resp == null || resp.path("code").asInt(-1) != 0) {
            String msg = resp == null ? "AI 服务无响应" : resp.path("msg").asText("AI 服务返回异常");
            throw new BusinessException(500, msg);
        }
        return resp.path("data");
    }
}
