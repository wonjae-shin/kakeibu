package com.kakeibu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Budget")
public class Budget {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "`month`", nullable = false)
    private String month;

    @Column(name = "amount", nullable = false)
    private int amount;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "categoryId")
    private String categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryId", insertable = false, updatable = false)
    private Category category;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}
