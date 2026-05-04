package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.entity.Account;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Account>>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAll(principal.getUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Account>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String type = (String) body.get("type");
        if (name == null || type == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("이름과 타입을 입력해주세요."));
        }
        int balance = body.get("balance") != null ? ((Number) body.get("balance")).intValue() : 0;
        try {
            return ResponseEntity.status(201).body(ApiResponse.ok(
                    accountService.create(principal.getUserId(), name, type, balance)));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Account>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            String type = (String) body.get("type");
            int balance = body.get("balance") != null ? ((Number) body.get("balance")).intValue() : 0;
            return ResponseEntity.ok(ApiResponse.ok(
                    accountService.update(principal.getUserId(), id, name, type, balance)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        try {
            accountService.delete(principal.getUserId(), id);
            return ResponseEntity.ok(ApiResponse.ok(null, "계좌가 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }
}
