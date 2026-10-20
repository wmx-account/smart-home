package com.smarthome.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Agent 的临时规则适配层。未来接入真实 Agent 时，只需将这里的规则执行替换为事件投递，
 * 上游的摄像头、YOLO 与设备接口无需改变。
 */
@Service
public class AgentRuleService {

    private static final Logger log = LoggerFactory.getLogger(AgentRuleService.class);

    private final DeviceService deviceService;

    public AgentRuleService(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    public String handlePersonDetected(String source, String imagePath, JsonNode detect) {
        // 这是未来 Agent 的结构化事件出口；现阶段先以日志和本地规则消费。
        log.info("agent-event source={}, imagePath={}, objectCount={}, objects={}",
                source, imagePath, detect.path("count").asInt(0), detect.path("objects"));
        return deviceService.applyPersonEnvironmentRule();
    }
}
