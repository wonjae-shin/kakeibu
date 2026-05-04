package com.kakeibu.service;

import com.kakeibu.entity.Transaction;
import com.kakeibu.repository.TransactionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<Transaction> getFiltered(String userId, String month, String category,
                                         String type, String search) {
        String monthPrefix = (month != null && !month.isBlank()) ? month + "%" : null;
        String catId = (category != null && !category.isBlank()) ? category : null;
        String typeVal = (type != null && !type.isBlank()) ? type : null;
        String searchVal = (search != null && !search.isBlank()) ? search : null;
        String searchLike = searchVal != null ? "%" + searchVal + "%" : null;

        List<Transaction> list = transactionRepository.findFiltered(userId, monthPrefix, catId, typeVal, searchVal, searchLike);
        list.forEach(t -> {
            // force load relations
            if (t.getCategory() != null) t.getCategory().getId();
            if (t.getAccount() != null) t.getAccount().getId();
        });
        return list;
    }

    public Transaction getById(String userId, String id) {
        Transaction t = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("거래를 찾을 수 없습니다."));
        if (t.getCategory() != null) t.getCategory().getId();
        if (t.getAccount() != null) t.getAccount().getId();
        return t;
    }

    @Transactional
    public Transaction create(String userId, String type, int amount, String memo,
                              String date, String categoryId, String accountId, boolean isRecurring) {
        Transaction t = new Transaction();
        t.setId(UUID.randomUUID().toString());
        t.setType(type);
        t.setAmount(amount);
        t.setMemo(memo);
        t.setDate(date);
        t.setCategoryId(categoryId);
        t.setAccountId(accountId);
        t.setRecurring(isRecurring);
        t.setUserId(userId);
        Transaction saved = transactionRepository.save(t);
        entityManager.flush();
        entityManager.refresh(saved);
        if (saved.getCategory() != null) saved.getCategory().getId();
        if (saved.getAccount() != null) saved.getAccount().getId();
        return saved;
    }

    @Transactional
    public Transaction update(String userId, String id, String type, Integer amount, String memo,
                              String date, String categoryId, String accountId, Boolean isRecurring) {
        Transaction t = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("거래를 찾을 수 없습니다."));
        if (type != null) t.setType(type);
        if (amount != null) t.setAmount(amount);
        if (memo != null) t.setMemo(memo);
        if (date != null) t.setDate(date);
        if (categoryId != null) t.setCategoryId(categoryId);
        if (accountId != null) t.setAccountId(accountId);
        if (isRecurring != null) t.setRecurring(isRecurring);
        Transaction saved = transactionRepository.save(t);
        entityManager.flush();
        entityManager.refresh(saved);
        if (saved.getCategory() != null) saved.getCategory().getId();
        if (saved.getAccount() != null) saved.getAccount().getId();
        return saved;
    }

    @Transactional
    public void delete(String userId, String id) {
        transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("거래를 찾을 수 없습니다."));
        transactionRepository.deleteById(id);
    }

    public Map<String, Object> getSummary(String userId, String month) {
        List<Transaction> list = transactionRepository.findByUserIdAndMonth(userId, month + "%");
        int income = list.stream().filter(t -> "income".equals(t.getType()))
                .mapToInt(Transaction::getAmount).sum();
        int expense = list.stream().filter(t -> "expense".equals(t.getType()))
                .mapToInt(Transaction::getAmount).sum();
        return Map.of("month", month, "income", income, "expense", expense, "balance", income - expense);
    }

    @Transactional
    public List<Transaction> generateRecurring(String userId, String month) {
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int mon = Integer.parseInt(parts[1]);

        YearMonth prevYM = YearMonth.of(year, mon).minusMonths(1);
        String prevMonth = prevYM.toString();

        List<Transaction> prevRecurring = transactionRepository.findRecurringByUserIdAndMonth(userId, prevMonth + "%");
        if (prevRecurring.isEmpty()) {
            return List.of();
        }

        List<Transaction> existingRecurring = transactionRepository.findRecurringByUserIdAndMonth(userId, month + "%");
        Set<String> existingKeys = existingRecurring.stream()
                .map(t -> t.getCategoryId() + "-" + t.getAccountId() + "-" + t.getAmount() + "-" + t.getType())
                .collect(Collectors.toSet());

        List<Transaction> toCreate = prevRecurring.stream()
                .filter(t -> {
                    String key = t.getCategoryId() + "-" + t.getAccountId() + "-" + t.getAmount() + "-" + t.getType();
                    return !existingKeys.contains(key);
                }).toList();

        if (toCreate.isEmpty()) {
            return List.of();
        }

        int daysInMonth = YearMonth.of(year, mon).lengthOfMonth();
        return toCreate.stream().map(t -> {
            int originalDay = Integer.parseInt(t.getDate().split("-")[2]);
            int day = Math.min(originalDay, daysInMonth);
            String newDate = month + "-" + String.format("%02d", day);
            return create(userId, t.getType(), t.getAmount(), t.getMemo(),
                    newDate, t.getCategoryId(), t.getAccountId(), true);
        }).toList();
    }
}
