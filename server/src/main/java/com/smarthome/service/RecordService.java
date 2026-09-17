package com.smarthome.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthome.entity.DetectRecord;
import com.smarthome.mapper.DetectRecordMapper;
import org.springframework.stereotype.Service;

/**
 * 检测记录业务：落库、分页查询、详情。
 */
@Service
public class RecordService {

    private final DetectRecordMapper recordMapper;
    private final ObjectMapper objectMapper;

    public RecordService(DetectRecordMapper recordMapper, ObjectMapper objectMapper) {
        this.recordMapper = recordMapper;
        this.objectMapper = objectMapper;
    }

    /** 根据 AI 返回结果组装记录并入库，返回主键 ID */
    public Long save(String imagePath, String modelName, Double conf, JsonNode data, long costMs) {
        DetectRecord record = new DetectRecord();
        record.setImagePath(imagePath);
        record.setModelName(modelName);
        record.setConfThreshold(conf);
        record.setObjectCount(data.path("count").asInt(0));
        record.setImageWidth(data.path("image_width").asInt(0));
        record.setImageHeight(data.path("image_height").asInt(0));
        record.setCostMs((int) costMs);
        try {
            record.setResultJson(objectMapper.writeValueAsString(data));
        } catch (Exception e) {
            record.setResultJson(null);
        }
        recordMapper.insert(record);
        return record.getId();
    }

    /** 按检测时间倒序分页 */
    public IPage<DetectRecord> page(long pageNum, long pageSize) {
        Page<DetectRecord> page = new Page<>(pageNum, pageSize);
        return recordMapper.selectPage(page, null);
    }

    public DetectRecord getById(Long id) {
        return recordMapper.selectDetailById(id);
    }
}
