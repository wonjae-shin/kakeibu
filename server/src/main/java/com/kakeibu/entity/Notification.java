package com.kakeibu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Notification")
public class Notification {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "raw", nullable = false)
    private String raw;

    @Column(name = "appName")
    private String appName;

    @Column(name = "amount")
    private Integer amount;

    @Column(name = "merchant")
    private String merchant;

    @Column(name = "cardName")
    private String cardName;

    @Column(name = "type", nullable = false)
    private String type = "expense";

    @Column(name = "status", nullable = false)
    private String status = "pending";

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "transactionId")
    private String transactionId;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRaw() { return raw; }
    public void setRaw(String raw) { this.raw = raw; }
    public String getAppName() { return appName; }
    public void setAppName(String appName) { this.appName = appName; }
    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }
    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }
    public String getCardName() { return cardName; }
    public void setCardName(String cardName) { this.cardName = cardName; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
