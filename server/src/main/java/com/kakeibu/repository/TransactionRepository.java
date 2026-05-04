package com.kakeibu.repository;

import com.kakeibu.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, String> {

    Optional<Transaction> findByIdAndUserId(String id, String userId);

    @Query(value = """
        SELECT t.* FROM "Transaction" t
        WHERE t.userId = :userId
          AND (:monthPrefix IS NULL OR t.date LIKE :monthPrefix)
          AND (:categoryId IS NULL OR t.categoryId = :categoryId)
          AND (:type IS NULL OR t.type = :type)
          AND (:search IS NULL OR t.memo LIKE :searchLike
               OR t.categoryId IN (SELECT c.id FROM "Category" c WHERE c.name LIKE :searchLike))
        ORDER BY t.date DESC, t.createdAt DESC
        """, nativeQuery = true)
    List<Transaction> findFiltered(@Param("userId") String userId,
                                   @Param("monthPrefix") String monthPrefix,
                                   @Param("categoryId") String categoryId,
                                   @Param("type") String type,
                                   @Param("search") String search,
                                   @Param("searchLike") String searchLike);

    @Query(value = "SELECT t.* FROM \"Transaction\" t WHERE t.userId = :userId AND t.date LIKE :monthPrefix ORDER BY t.date DESC, t.createdAt DESC", nativeQuery = true)
    List<Transaction> findByUserIdAndMonth(@Param("userId") String userId, @Param("monthPrefix") String monthPrefix);

    @Query(value = "SELECT t.* FROM \"Transaction\" t WHERE t.userId = :userId AND t.isRecurring = 1 AND t.date LIKE :monthPrefix", nativeQuery = true)
    List<Transaction> findRecurringByUserIdAndMonth(@Param("userId") String userId, @Param("monthPrefix") String monthPrefix);

    @Query(value = "SELECT t.* FROM \"Transaction\" t WHERE t.userId = :userId AND t.date LIKE :yearPrefix ORDER BY t.date ASC", nativeQuery = true)
    List<Transaction> findByUserIdAndYear(@Param("userId") String userId, @Param("yearPrefix") String yearPrefix);

    @Query(value = """
        SELECT t.* FROM "Transaction" t
        WHERE t.userId = :userId AND t.date LIKE :monthPrefix AND t.type = 'expense'
        """, nativeQuery = true)
    List<Transaction> findExpenseByUserIdAndMonth(@Param("userId") String userId, @Param("monthPrefix") String monthPrefix);
}
