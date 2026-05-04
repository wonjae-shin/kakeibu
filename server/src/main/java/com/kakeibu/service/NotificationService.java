package com.kakeibu.service;

import com.kakeibu.entity.Notification;
import com.kakeibu.entity.Transaction;
import com.kakeibu.repository.NotificationRepository;
import com.kakeibu.util.NotificationParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TransactionService transactionService;
    private final NotificationParser parser;

    public NotificationService(NotificationRepository notificationRepository,
                               TransactionService transactionService,
                               NotificationParser parser) {
        this.notificationRepository = notificationRepository;
        this.transactionService = transactionService;
        this.parser = parser;
    }

    @Transactional
    public Notification ingest(String userId, String text, String appName) {
        NotificationParser.ParsedNotification parsed = parser.parse(text, appName);
        if (parsed == null || parsed.amount() <= 0) {
            return null;
        }

        Notification n = new Notification();
        n.setId(UUID.randomUUID().toString());
        n.setRaw(text);
        n.setAppName(appName != null && !appName.isBlank() ? appName : null);
        n.setAmount(parsed.amount());
        n.setMerchant(parsed.merchant() != null && !parsed.merchant().isBlank() ? parsed.merchant() : null);
        n.setCardName(parsed.cardName());
        n.setType(parsed.type());
        n.setStatus("pending");
        n.setUserId(userId);
        return notificationRepository.save(n);
    }

    public List<Notification> getAll(String userId, String status) {
        return notificationRepository.findByUserIdAndStatus(userId, status);
    }

    public long getPendingCount(String userId) {
        return notificationRepository.countByUserIdAndStatus(userId, "pending");
    }

    @Transactional
    public Transaction confirm(String userId, String id, Map<String, Object> body) {
        Notification n = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        String categoryId = (String) body.get("categoryId");
        String accountId = (String) body.get("accountId");
        int amount = body.get("amount") != null ? ((Number) body.get("amount")).intValue()
                : (n.getAmount() != null ? n.getAmount() : 0);
        String memo = body.get("memo") != null ? (String) body.get("memo") : (n.getMerchant() != null ? n.getMerchant() : "");
        String date = body.get("date") != null ? (String) body.get("date") : LocalDate.now().toString();
        String type = body.get("type") != null ? (String) body.get("type") : n.getType();

        Transaction t = transactionService.create(userId, type, amount, memo, date, categoryId, accountId, false);

        n.setStatus("confirmed");
        n.setTransactionId(t.getId());
        notificationRepository.save(n);

        return t;
    }

    @Transactional
    public void dismiss(String userId, String id) {
        notificationRepository.findByIdAndUserId(id, userId).ifPresent(n -> {
            n.setStatus("dismissed");
            notificationRepository.save(n);
        });
    }
}
