package com.kakeibu.service;

import com.kakeibu.entity.Budget;
import com.kakeibu.repository.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    public List<Budget> getAll(String userId, String month) {
        if (month != null && !month.isBlank()) {
            return budgetRepository.findByUserIdAndMonthOrderByCategoryIdAsc(userId, month);
        }
        return budgetRepository.findByUserIdOrderByCategoryIdAsc(userId);
    }

    @Transactional
    public Budget create(String userId, String month, int amount, String categoryId) {
        Budget b = new Budget();
        b.setId(UUID.randomUUID().toString());
        b.setMonth(month);
        b.setAmount(amount);
        b.setCategoryId(categoryId);
        b.setUserId(userId);
        return budgetRepository.save(b);
    }

    @Transactional
    public Budget update(String userId, String id, int amount) {
        Budget b = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("예산을 찾을 수 없습니다."));
        b.setAmount(amount);
        return budgetRepository.save(b);
    }

    @Transactional
    public void delete(String userId, String id) {
        Budget b = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("예산을 찾을 수 없습니다."));
        budgetRepository.delete(b);
    }
}
