package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.dto.TransactionDto;
import com.kakeibu.entity.Transaction;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/generate-recurring")
    public ResponseEntity<ApiResponse<List<TransactionDto>>> generateRecurring(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        if (month == null) month = LocalDate.now().toString().substring(0, 7);
        List<Transaction> created = transactionService.generateRecurring(principal.getUserId(), month);
        String msg = created.isEmpty() ? "이미 생성된 정기 거래입니다." : created.size() + "건의 정기 거래가 생성되었습니다.";
        return ResponseEntity.ok(ApiResponse.ok(created.stream().map(TransactionDto::from).toList(), msg));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getSummary(principal.getUserId(), month)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TransactionDto>>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        List<Transaction> list = transactionService.getFiltered(principal.getUserId(), month, category, type, search);
        return ResponseEntity.ok(ApiResponse.ok(list.stream().map(TransactionDto::from).toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> getOne(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(TransactionDto.from(transactionService.getById(principal.getUserId(), id))));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionDto>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        String type = (String) body.get("type");
        Object amountObj = body.get("amount");
        String date = (String) body.get("date");
        String categoryId = (String) body.get("categoryId");
        String accountId = (String) body.get("accountId");
        if (type == null || amountObj == null || date == null || categoryId == null || accountId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("필수 필드가 누락되었습니다."));
        }
        int amount = ((Number) amountObj).intValue();
        String memo = (String) body.get("memo");
        boolean isRecurring = Boolean.TRUE.equals(body.get("isRecurring"));
        Transaction created = transactionService.create(principal.getUserId(), type, amount, memo, date, categoryId, accountId, isRecurring);
        return ResponseEntity.status(201).body(ApiResponse.ok(TransactionDto.from(created)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionDto>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String type = (String) body.get("type");
            Integer amount = body.get("amount") != null ? ((Number) body.get("amount")).intValue() : null;
            String memo = (String) body.get("memo");
            String date = (String) body.get("date");
            String categoryId = (String) body.get("categoryId");
            String accountId = (String) body.get("accountId");
            Boolean isRecurring = body.get("isRecurring") != null ? (Boolean) body.get("isRecurring") : null;
            Transaction updated = transactionService.update(principal.getUserId(), id, type, amount, memo, date, categoryId, accountId, isRecurring);
            return ResponseEntity.ok(ApiResponse.ok(TransactionDto.from(updated)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        try {
            transactionService.delete(principal.getUserId(), id);
            return ResponseEntity.ok(ApiResponse.ok(null, "거래가 삭제되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        }
    }
}
