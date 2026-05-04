package com.kakeibu.dto;

import com.kakeibu.entity.Category;

public record CategoryDto(
        String id,
        String name,
        String type,
        String icon,
        String color,
        boolean isDefault,
        String userId,
        String parentId,
        Integer order,
        boolean hidden
) {
    public static CategoryDto from(Category c, boolean hidden) {
        return new CategoryDto(
                c.getId(), c.getName(), c.getType(), c.getIcon(), c.getColor(),
                c.isDefault(), c.getUserId(), c.getParentId(), c.getOrder(), hidden
        );
    }
}
