package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.StatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> monthly(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String year) {
        return ResponseEntity.ok(ApiResponse.ok(statsService.getMonthly(principal.getUserId(), year)));
    }

    @GetMapping("/category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> category(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.ok(statsService.getCategoryStats(principal.getUserId(), month)));
    }
}
