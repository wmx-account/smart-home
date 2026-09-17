package com.smarthome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smarthome.entity.DetectRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 检测记录 Mapper。继承 BaseMapper 即自动拥有 insert/selectById/selectPage 等
 * 单表增删改查方法，无需写 XML；复杂 SQL 才需要手写。
 */
@Mapper
public interface DetectRecordMapper extends BaseMapper<DetectRecord> {

    /**
     * 详情查询：实体中 resultJson 标注了 @TableField(select=false)（列表不查大字段），
     * 这里手写 SQL 显式 SELECT * 把完整结果 JSON 一并查出。
     */
    @Select("SELECT * FROM detect_record WHERE id = #{id}")
    DetectRecord selectDetailById(Long id);
}
