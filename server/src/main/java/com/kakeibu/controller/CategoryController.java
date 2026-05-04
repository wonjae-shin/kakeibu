package com.kakeibu.controller;

import com.kakeibu.dto.ApiResponse;
import com.kakeibu.dto.CategoryDto;
import com.kakeibu.entity.Category;
import com.kakeibu.security.UserPrincipal;
import com.kakeibu.service.CategoryService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getCategories(principal.getUserId())));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorder(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        if (items == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("잘못된 요청입니다."));
        }
        categoryService.reorder(items);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        String name = body.get("name"), type = body.get("type"),
               icon = body.get("icon"), color = body.get("color"),
               parentId = body.get("parentId");
        if (name == null || type == null || icon == null || color == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("모든 필드를 입력해주세요."));
        }
        try {
            Category created = categoryService.create(principal.getUserId(), name, type, icon, color, parentId);
            return ResponseEntity.status(201).body(ApiResponse.ok(created));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            Category updated = categoryService.update(principal.getUserId(), id,
                    body.get("name"), body.get("type"), body.get("icon"), body.get("color"));
            return ResponseEntity.ok(ApiResponse.ok(updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(ApiResponse.fail(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        try {
            String msg = categoryService.delete(principal.getUserId(), id);
            return ResponseEntity.ok(ApiResponse.ok(null, msg));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("이 카테고리를 사용하는 거래 내역이 있어 삭제할 수 없습니다."));
        }
    }

    @PostMapping("/hidden/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        categoryService.restore(principal.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "카테고리가 복원되었습니다."));
    }
}
