package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.entity.User;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/anonymous")
    public ResponseEntity<ApiResponse<Map<String, Object>>> anonymous(@RequestBody Map<String, String> body) {
        String deviceId = body.get("deviceId");
        if (deviceId == null || deviceId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("deviceId가 필요합니다."));
        }
        try {
            return ResponseEntity.ok(ApiResponse.ok(authService.anonymousLogin(deviceId)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("서버 오류가 발생했습니다."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("이메일과 비밀번호를 입력해주세요."));
        }
        try {
            return ResponseEntity.ok(ApiResponse.ok(authService.login(email, password)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("이메일과 비밀번호를 입력해주세요."));
        }
        try {
            return ResponseEntity.ok(ApiResponse.ok(authService.register(principal.getUserId(), email, password)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        } catch (IllegalStateException e) {
            String msg = e.getMessage();
            int status = msg.contains("이미 등록") ? 400 : 409;
            return ResponseEntity.status(status).body(ApiResponse.fail(msg));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("refreshToken이 없습니다."));
        }
        try {
            String accessToken = authService.refreshAccessToken(refreshToken);
            return ResponseEntity.ok(ApiResponse.ok(Map.of("accessToken", accessToken)));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.fail("유효하지 않은 토큰입니다."));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) Map<String, String> body) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.ok(null, "로그아웃 되었습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            User user = authService.getMe(principal.getUserId());
            Map<String, Object> data = Map.of(
                    "id", user.getId(),
                    "email", user.getEmail() != null ? user.getEmail() : "",
                    "isAnonymous", user.isAnonymous(),
                    "createdAt", user.getCreatedAt()
            );
            return ResponseEntity.ok(ApiResponse.ok(data));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.fail("사용자를 찾을 수 없습니다."));
        }
    }
}
