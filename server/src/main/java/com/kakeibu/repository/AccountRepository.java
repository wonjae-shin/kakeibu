package com.kakeibu.repository;

import com.kakeibu.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, String> {
    List<Account> findByUserIdOrderByNameAsc(String userId);
    Optional<Account> findByIdAndUserId(String id, String userId);
    long countByUserId(String userId);
}
