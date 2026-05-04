package com.kakeibu.dto;

import com.kakeibu.entity.Account;
import com.kakeibu.entity.Category;
import com.kakeibu.entity.Transaction;

import java.time.LocalDateTime;

public record TransactionDto(
        String id,
        String type,
        int amount,
        String memo,
        String date,
        boolean isRecurring,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String userId,
        String categoryId,
        String accountId,
        CategoryInfo category,
        AccountInfo account
) {
    public record CategoryInfo(String id, String name, String type, String icon, String color,
                               boolean isDefault, String userId, String parentId, Integer order) {}
    public record AccountInfo(String id, String name, String type, int balance, String userId) {}

    public static TransactionDto from(Transaction t) {
        CategoryInfo cat = null;
        if (t.getCategory() != null) {
            Category c = t.getCategory();
            cat = new CategoryInfo(c.getId(), c.getName(), c.getType(), c.getIcon(), c.getColor(),
                    c.isDefault(), c.getUserId(), c.getParentId(), c.getOrder());
        }
        AccountInfo acc = null;
        if (t.getAccount() != null) {
            Account a = t.getAccount();
            acc = new AccountInfo(a.getId(), a.getName(), a.getType(), a.getBalance(), a.getUserId());
        }
        return new TransactionDto(t.getId(), t.getType(), t.getAmount(), t.getMemo(), t.getDate(),
                t.isRecurring(), t.getCreatedAt(), t.getUpdatedAt(),
                t.getUserId(), t.getCategoryId(), t.getAccountId(), cat, acc);
    }
}
