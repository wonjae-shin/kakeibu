package com.kakeibu.repository;

import com.kakeibu.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, String> {
    List<Budget> findByUserIdOrderByCategoryIdAsc(String userId);
    List<Budget> findByUserIdAndMonthOrderByCategoryIdAsc(String userId, String month);
    Optional<Budget> findByIdAndUserId(String id, String userId);
}
