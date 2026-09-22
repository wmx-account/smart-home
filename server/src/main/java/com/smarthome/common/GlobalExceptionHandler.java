package com.smarthome.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartException;

/**
 * 全局异常处理：把各类异常统一包装成 ApiResponse，避免把堆栈直接抛给前端。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 业务参数错误（如空文件） */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        HttpStatus status = e.getCode() == 404 ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(ApiResponse.fail(e.getCode(), e.getMessage()));
    }

    /** @Valid 请求体参数校验失败（如风扇档位不在 0~2、开关为 null），返回 400 + 首条字段错误 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst()
                .orElse("请求参数校验失败");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(400, msg));
    }

    /** 上传文件超限等 multipart 问题 */
    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse<Void>> handleMultipart(MultipartException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(400, "图片上传失败：" + e.getMessage()));
    }

    /** 调不通 Python AI 服务（未启动 / 网络问题） */
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ApiResponse<Void>> handleAiService(RestClientException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.fail(503,
                        "AI 推理服务不可用，请确认 ai-platform（8000 端口）已启动。原因：" + e.getMessage()));
    }

    /** 兜底异常 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOther(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(500, "服务异常：" + e.getMessage()));
    }
}
