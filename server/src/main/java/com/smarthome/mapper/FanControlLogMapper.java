package com.smarthome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smarthome.entity.FanControlLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 风扇控制日志 Mapper，单表增删改查由 BaseMapper 提供。
 */
@Mapper
public interface FanControlLogMapper extends BaseMapper<FanControlLog> {
}
