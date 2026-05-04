package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.dto.TransactionDto;
import com.kakeibu.entity.Notification;
import com.kakeibu.entity.Transaction;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ingest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        String text = body.get("text");
        String appName = body.getOrDefault("appName", "");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("알림 텍스트가 필요합니다."));
        }
        Notification n = notificationService.ingest(principal.getUserId(), text, appName);
        if (n == null) {
            return ResponseEntity.ok(ApiResponse.ok(null, "금액을 파싱할 수 없어 무시됨"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", n.getId(), "status", "pending")));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getAll(principal.getUserId(), status)));
    }

    @GetMapping("/pending-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> pendingCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getPendingCount(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", count)));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<TransactionDto>> confirm(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            Transaction t = notificationService.confirm(principal.getUserId(), id, body);
            return ResponseEntity.ok(ApiResponse.ok(TransactionDto.from(t)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<ApiResponse<Void>> dismiss(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        notificationService.dismiss(principal.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
