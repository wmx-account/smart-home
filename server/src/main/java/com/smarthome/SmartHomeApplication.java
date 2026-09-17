package com.smarthome;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 智能家居边缘智能系统 - Java 业务服务启动类。
 * 端口 8080，对前端提供 /api/** 接口，内部转发请求给 Python AI 推理服务（8000）。
 */
@SpringBootApplication
public class SmartHomeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartHomeApplication.class, args);
    }
}
