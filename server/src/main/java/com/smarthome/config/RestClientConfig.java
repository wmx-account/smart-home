package com.smarthome.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * HTTP 客户端配置：RestClient（Spring 6 新一代同步 HTTP 客户端），
 * 统一设置 Python AI 服务的 baseUrl。
 *
 * 说明：RestClient 默认底层是 JDK HttpClient，会发起 HTTP/2 明文升级（h2c），
 * 而 Python 端 uvicorn 仅支持 HTTP/1.1，带文件的 POST 会因此失败，
 * 所以这里显式指定基于 HttpURLConnection 的 SimpleClientHttpRequestFactory。
 */
@Configuration
@EnableConfigurationProperties(AiServiceProperties.class)
public class RestClientConfig {

    @Bean
    public RestClient aiRestClient(AiServiceProperties properties) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));   // 建连超时：AI 服务没启动时快速失败
        factory.setReadTimeout(Duration.ofSeconds(60));     // 读取超时：模型推理可能较慢
        return RestClient.builder()
                .baseUrl(properties.getUrl())
                .requestFactory(factory)
                .build();
    }
}
