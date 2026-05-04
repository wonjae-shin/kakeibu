package com.kakeibu.service;

import com.kakeibu.entity.Category;
import com.kakeibu.entity.Transaction;
import com.kakeibu.repository.CategoryRepository;
import com.kakeibu.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public StatsService(TransactionRepository transactionRepository,
                        CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Map<String, Object>> getMonthly(String userId, String year) {
        List<Transaction> transactions = transactionRepository.findByUserIdAndYear(userId, year + "%");

        Map<String, int[]> monthly = new LinkedHashMap<>();
        for (int m = 1; m <= 12; m++) {
            String key = year + "-" + String.format("%02d", m);
            monthly.put(key, new int[]{0, 0}); // [income, expense]
        }

        for (Transaction t : transactions) {
            String key = t.getDate().substring(0, 7);
            if (monthly.containsKey(key)) {
                if ("income".equals(t.getType())) monthly.get(key)[0] += t.getAmount();
                else monthly.get(key)[1] += t.getAmount();
            }
        }

        return monthly.entrySet().stream().map(e -> Map.of(
                "month", (Object) e.getKey(),
                "income", e.getValue()[0],
                "expense", e.getValue()[1]
        )).toList();
    }

    public Map<String, Object> getCategoryStats(String userId, String month) {
        List<Transaction> transactions = transactionRepository.findExpenseByUserIdAndMonth(userId, month + "%");
        if (transactions.isEmpty()) {
            return Map.of("total", 0, "categories", List.of());
        }

        // load categories map
        Set<String> catIds = transactions.stream().map(Transaction::getCategoryId).collect(Collectors.toSet());
        Map<String, Category> catMap = categoryRepository.findAllById(catIds).stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        int total = transactions.stream().mapToInt(Transaction::getAmount).sum();

        record CatEntry(String categoryId, String name, String icon, String color, int[] amount) {}

        Map<String, CatEntry> parentMap = new LinkedHashMap<>();
        Map<String, Map<String, CatEntry>> childrenMap = new LinkedHashMap<>();

        for (Transaction t : transactions) {
            Category cat = catMap.get(t.getCategoryId());
            if (cat == null) continue;

            Category parent = (cat.getParentId() != null) ? catMap.get(cat.getParentId()) : null;
            if (parent == null) parent = cat;
            final String parentId = parent.getId();
            final Category parentCat = parent;

            parentMap.computeIfAbsent(parentId, k ->
                    new CatEntry(k, parentCat.getName(), parentCat.getIcon(), parentCat.getColor(), new int[]{0}));
            parentMap.get(parentId).amount()[0] += t.getAmount();

            if (cat.getParentId() != null) {
                childrenMap.computeIfAbsent(parentId, k -> new LinkedHashMap<>());
                childrenMap.get(parentId).computeIfAbsent(cat.getId(), k ->
                        new CatEntry(k, cat.getName(), cat.getIcon(), cat.getColor(), new int[]{0}));
                childrenMap.get(parentId).get(cat.getId()).amount()[0] += t.getAmount();
            }
        }

        List<Map<String, Object>> data = parentMap.values().stream()
                .sorted(Comparator.comparingInt((CatEntry e) -> e.amount()[0]).reversed())
                .map(e -> {
                    int parentAmount = e.amount()[0];
                    List<Map<String, Object>> children = childrenMap.getOrDefault(e.categoryId(), Map.of())
                            .values().stream()
                            .sorted(Comparator.comparingInt((CatEntry ch) -> ch.amount()[0]).reversed())
                            .map(ch -> {
                                Map<String, Object> m = new LinkedHashMap<>();
                                m.put("categoryId", ch.categoryId());
                                m.put("name", ch.name());
                                m.put("icon", ch.icon());
                                m.put("color", ch.color());
                                m.put("amount", ch.amount()[0]);
                                m.put("ratio", parentAmount > 0 ? Math.round((double) ch.amount()[0] / parentAmount * 100) : 0);
                                return m;
                            }).toList();

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("categoryId", e.categoryId());
                    m.put("name", e.name());
                    m.put("icon", e.icon());
                    m.put("color", e.color());
                    m.put("amount", parentAmount);
                    m.put("ratio", total > 0 ? Math.round((double) parentAmount / total * 100) : 0);
                    m.put("children", children);
                    return m;
                }).toList();

        return Map.of("total", total, "categories", data);
    }
}
