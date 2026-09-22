package com.smarthome.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 风扇控制请求体：POST /api/device/fan。
 * power=true 开机时 speed 必须为 1（半速）或 2（全速）；power=false 关机时 speed 后端置 0。
 */
public class FanControlRequest {

    /** 风扇开关，必传 */
    @NotNull(message = "风扇开关 power 不能为 null")
    private Boolean power;

    /** 档位：0 关 / 1 半速 / 2 全速（关机时可不传） */
    @Min(value = 0, message = "档位取值为 0/1/2")
    @Max(value = 2, message = "档位取值为 0/1/2")
    private Integer speed;

    public Boolean getPower() {
        return power;
    }

    public void setPower(Boolean power) {
        this.power = power;
    }

    public Integer getSpeed() {
        return speed;
    }

    public void setSpeed(Integer speed) {
        this.speed = speed;
    }
}
