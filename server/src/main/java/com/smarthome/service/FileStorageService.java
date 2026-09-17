package com.smarthome.service;

import com.smarthome.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 上传图片本地存储：按 年月 分目录、UUID 重命名，避免重名覆盖。
 */
@Service
public class FileStorageService {

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /** 保存图片，返回相对路径，如 uploads/202609/xxxx.jpg */
    public String save(MultipartFile file) {
        String original = file.getOriginalFilename();
        String ext = ".jpg";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            Path dir = uploadRoot.resolve(month);
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            Files.write(target, file.getBytes());
            return "uploads/" + month + "/" + filename;
        } catch (IOException e) {
            throw new BusinessException(500, "图片保存失败：" + e.getMessage());
        }
    }
}
