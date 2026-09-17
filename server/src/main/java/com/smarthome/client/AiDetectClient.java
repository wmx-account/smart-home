package com.smarthome.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.smarthome.common.BusinessException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * AI 推理服务调用客户端：把前端上传的图片以 multipart 形式转发给
 * Python ai-platform 的 POST /detect，并原样拿回检测结果 JSON。
 */
@Component
public class AiDetectClient {

    private final RestClient aiRestClient;

    public AiDetectClient(RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

    /**
     * 调用 AI 服务 /detect。
     *
     * @return Python 端完整响应体（含 code/msg/data），以 JsonNode 透传
     */
    public JsonNode detect(MultipartFile file, String modelName, Double conf) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        String filename = (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank())
                ? "image.jpg" : file.getOriginalFilename();
        try {
            // MultipartFile 上传后是临时字节，包装成带文件名的 Resource 才能被 RestClient 当文件发送
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            body.add("file", fileResource);
            body.add("model_name", modelName);
            body.add("conf", String.valueOf(conf));
        } catch (IOException e) {
            throw new BusinessException(400, "读取上传图片失败：" + e.getMessage());
        }

        return aiRestClient.post()
                .uri("/detect")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
    }

    /** 探活：调用 AI 服务 /health */
    public JsonNode health() {
        return aiRestClient.get().uri("/health").retrieve().body(JsonNode.class);
    }
}
