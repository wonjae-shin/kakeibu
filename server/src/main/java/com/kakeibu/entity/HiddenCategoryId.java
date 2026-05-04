package com.kakeibu.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class HiddenCategoryId implements Serializable {

    @Column(name = "userId")
    private String userId;

    @Column(name = "categoryId")
    private String categoryId;

    public HiddenCategoryId() {}

    public HiddenCategoryId(String userId, String categoryId) {
        this.userId = userId;
        this.categoryId = categoryId;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HiddenCategoryId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(categoryId, that.categoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, categoryId);
    }
}
