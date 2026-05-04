package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ApiResponse<Void> health() {
        return ApiResponse.ok(null, "서버 정상 동작 중");
    }
}
