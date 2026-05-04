package com.kakeibu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "HiddenCategory")
public class HiddenCategory {

    @EmbeddedId
    private HiddenCategoryId id;

    public HiddenCategory() {}

    public HiddenCategory(String userId, String categoryId) {
        this.id = new HiddenCategoryId(userId, categoryId);
    }

    public HiddenCategoryId getId() { return id; }
    public void setId(HiddenCategoryId id) { this.id = id; }
}
