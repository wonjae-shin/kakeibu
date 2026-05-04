package com.kakeibu.service;

import com.kakeibu.entity.Account;
import com.kakeibu.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public List<Account> getAll(String userId) {
        return accountRepository.findByUserIdOrderByNameAsc(userId);
    }

    @Transactional
    public Account create(String userId, String name, String type, int balance) {
        if (accountRepository.countByUserId(userId) >= 20) {
            throw new IllegalStateException("계좌는 최대 20개까지 추가할 수 있습니다.");
        }
        Account a = new Account();
        a.setId(UUID.randomUUID().toString());
        a.setName(name);
        a.setType(type);
        a.setBalance(balance);
        a.setUserId(userId);
        return accountRepository.save(a);
    }

    @Transactional
    public Account update(String userId, String id, String name, String type, int balance) {
        Account a = accountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다."));
        a.setName(name);
        a.setType(type);
        a.setBalance(balance);
        return accountRepository.save(a);
    }

    @Transactional
    public void delete(String userId, String id) {
        Account a = accountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("계좌를 찾을 수 없습니다."));
        accountRepository.delete(a);
    }
}
