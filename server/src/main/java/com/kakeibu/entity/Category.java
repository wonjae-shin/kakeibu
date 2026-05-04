package com.kakeibu.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Category")
public class Category {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "icon", nullable = false)
    private String icon;

    @Column(name = "color", nullable = false)
    private String color;

    @Column(name = "isDefault", nullable = false)
    private boolean isDefault = false;

    @Column(name = "userId")
    private String userId;

    @Column(name = "parentId")
    private String parentId;

    @Column(name = "`order`")
    private Integer order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parentId", insertable = false, updatable = false)
    private Category parent;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
    public Category getParent() { return parent; }
    public void setParent(Category parent) { this.parent = parent; }
}
