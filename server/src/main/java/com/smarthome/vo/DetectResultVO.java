package com.smarthome.vo;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * /api/detect 返回给前端的视图对象：数据库记录 ID、可回看的图片地址、AI 检测结果。
 */
public class DetectResultVO {

    private Long recordId;
    private String imageUrl;
    private JsonNode detect;
    /** 本次画面是否已作为检测记录和图片持久化。 */
    private boolean persisted;
    /** 预留 Agent 规则的本次处理结果。 */
    private String agentAction;

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public JsonNode getDetect() {
        return detect;
    }

    public void setDetect(JsonNode detect) {
        this.detect = detect;
    }

    public boolean isPersisted() {
        return persisted;
    }

    public void setPersisted(boolean persisted) {
        this.persisted = persisted;
    }

    public String getAgentAction() {
        return agentAction;
    }

    public void setAgentAction(String agentAction) {
        this.agentAction = agentAction;
    }
}
