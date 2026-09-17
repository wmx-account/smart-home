package com.smarthome.common;

/**
 * 业务异常：参数错误等可预期问题，由全局异常处理器转成统一响应。
 */
public class BusinessException extends RuntimeException {

    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
