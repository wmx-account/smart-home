package com.smarthome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smarthome.entity.Device;
import org.apache.ibatis.annotations.Mapper;

/**
 * 设备 Mapper，单表增删改查由 BaseMapper 提供。
 */
@Mapper
public interface DeviceMapper extends BaseMapper<Device> {
}
