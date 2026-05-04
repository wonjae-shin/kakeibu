package com.kakeibu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Account")
public class Account {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "balance", nullable = false)
    private int balance = 0;

    @Column(name = "userId", nullable = false)
    private String userId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getBalance() { return balance; }
    public void setBalance(int balance) { this.balance = balance; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
