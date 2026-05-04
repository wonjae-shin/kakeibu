package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.entity.Budget;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.BudgetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Budget>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(budgetService.getAll(principal.getUserId(), month)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Budget>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        String month = (String) body.get("month");
        Object amountObj = body.get("amount");
        if (month == null || amountObj == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("month와 amount는 필수입니다."));
        }
        int amount = ((Number) amountObj).intValue();
        String categoryId = (String) body.get("categoryId");
        Budget created = budgetService.create(principal.getUserId(), month, amount, categoryId);
        return ResponseEntity.status(201).body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Budget>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            int amount = ((Number) body.get("amount")).intValue();
            return ResponseEntity.ok(ApiResponse.ok(budgetService.update(principal.getUserId(), id, amount)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        try {
            budgetService.delete(principal.getUserId(), id);
            return ResponseEntity.ok(ApiResponse.ok(null, "예산이 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }
}
