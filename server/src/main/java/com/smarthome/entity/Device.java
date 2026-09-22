package com.smarthome.entity;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 设备实体，对应数据库表 device（物联网设备/网关登记）。
 */
@TableName("device")
public class Device {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 设备唯一编码，如 living-room-01 */
    private String deviceCode;

    /** 设备名称 */
    private String name;

    /** 设备类型：gateway 网关 / sensor 传感器 */
    private String type;

    /** 是否在线：1 在线 0 离线 */
    private Integer online;

    /** 数据库默认 CURRENT_TIMESTAMP 自动填充，插入时不写该列 */
    @TableField(insertStrategy = FieldStrategy.NEVER)
    private LocalDateTime createTime;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceCode() {
        return deviceCode;
    }

    public void setDeviceCode(String deviceCode) {
        this.deviceCode = deviceCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getOnline() {
        return online;
    }

    public void setOnline(Integer online) {
        this.online = online;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
