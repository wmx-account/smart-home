package com.smarthome.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 检测记录实体，对应数据库表 detect_record。
 * 字段用驼峰，MyBatis-Plus 默认自动映射下划线列（imagePath -> image_path）。
 */
@TableName("detect_record")
public class DetectRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 图片相对存储路径，如 uploads/202609/xxx.jpg */
    private String imagePath;

    private String modelName;

    private Double confThreshold;

    private Integer objectCount;

    private Integer imageWidth;

    private Integer imageHeight;

    /** AI 推理耗时（毫秒） */
    private Integer costMs;

    /** 完整检测结果 JSON；列表查询不返回该大字段（@TableField(select=false)），详情才取 */
    @TableField(select = false)
    private String resultJson;

    /** 数据库默认 CURRENT_TIMESTAMP 自动填充，插入时不写该列 */
    @TableField(insertStrategy = com.baomidou.mybatisplus.annotation.FieldStrategy.NEVER)
    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public Double getConfThreshold() {
        return confThreshold;
    }

    public void setConfThreshold(Double confThreshold) {
        this.confThreshold = confThreshold;
    }

    public Integer getObjectCount() {
        return objectCount;
    }

    public void setObjectCount(Integer objectCount) {
        this.objectCount = objectCount;
    }

    public Integer getImageWidth() {
        return imageWidth;
    }

    public void setImageWidth(Integer imageWidth) {
        this.imageWidth = imageWidth;
    }

    public Integer getImageHeight() {
        return imageHeight;
    }

    public void setImageHeight(Integer imageHeight) {
        this.imageHeight = imageHeight;
    }

    public Integer getCostMs() {
        return costMs;
    }

    public void setCostMs(Integer costMs) {
        this.costMs = costMs;
    }

    public String getResultJson() {
        return resultJson;
    }

    public void setResultJson(String resultJson) {
        this.resultJson = resultJson;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
