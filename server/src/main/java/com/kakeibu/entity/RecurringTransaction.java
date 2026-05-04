package com.kakeibu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "RecurringTransaction")
public class RecurringTransaction {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "amount", nullable = false)
    private int amount;

    @Column(name = "memo")
    private String memo;

    @Column(name = "dayOfMonth", nullable = false)
    private int dayOfMonth;

    @Column(name = "categoryId", nullable = false)
    private String categoryId;

    @Column(name = "accountId", nullable = false)
    private String accountId;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "isActive", nullable = false)
    private boolean isActive = true;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
    public int getDayOfMonth() { return dayOfMonth; }
    public void setDayOfMonth(int dayOfMonth) { this.dayOfMonth = dayOfMonth; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
