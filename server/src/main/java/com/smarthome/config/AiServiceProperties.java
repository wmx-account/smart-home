package com.smarthome.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Python AI 推理服务地址配置，对应 application.yml 中 ai.service.url。
 */
@ConfigurationProperties(prefix = "ai.service")
public class AiServiceProperties {

    /** ai-platform 基础地址 */
    private String url = "http://127.0.0.1:8000";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
