package com.smarthome.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smarthome.entity.SensorData;
import com.smarthome.vo.SensorPointVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 传感器时序数据 Mapper：单表写入由 BaseMapper 提供，另含时间桶聚合查询。
 */
@Mapper
public interface SensorDataMapper extends BaseMapper<SensorData> {

    /**
     * 时间桶聚合：按 bucketSec 秒把 create_time 归桶，取每桶内温湿度/光照平均值。
     * 用 UNIX_TIMESTAMP 整除实现任意秒数等宽分桶，避免一次返回过密的原始点把前端压垮。
     */
    @Select("""
            SELECT FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(create_time) / #{bucket}) * #{bucket}) AS bucket_time,
                   AVG(temperature) AS temperature,
                   AVG(humidity) AS humidity,
                   AVG(light) AS light
            FROM sensor_data
            WHERE device_id = #{deviceId} AND create_time >= #{since}
            GROUP BY bucket_time
            ORDER BY bucket_time
            """)
    List<SensorPointVO> selectAggregated(@Param("deviceId") Long deviceId,
                                         @Param("bucket") long bucketSec,
                                         @Param("since") LocalDateTime since);
}
