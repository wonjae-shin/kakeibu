package com.kakeibu.service;

import com.kakeibu.dto.CategoryDto;
import com.kakeibu.entity.Category;
import com.kakeibu.entity.HiddenCategory;
import com.kakeibu.entity.HiddenCategoryId;
import com.kakeibu.repository.CategoryRepository;
import com.kakeibu.repository.HiddenCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final HiddenCategoryRepository hiddenCategoryRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           HiddenCategoryRepository hiddenCategoryRepository) {
        this.categoryRepository = categoryRepository;
        this.hiddenCategoryRepository = hiddenCategoryRepository;
    }

    public List<CategoryDto> getCategories(String userId) {
        Set<String> hiddenIds = hiddenCategoryRepository.findByIdUserId(userId)
                .stream().map(h -> h.getId().getCategoryId()).collect(Collectors.toSet());

        return categoryRepository.findSystemAndUserCategories(userId)
                .stream()
                .map(c -> CategoryDto.from(c, hiddenIds.contains(c.getId())))
                .toList();
    }

    @Transactional
    public Category reorder(List<Map<String, Object>> items) {
        for (Map<String, Object> item : items) {
            String id = (String) item.get("id");
            int order = ((Number) item.get("order")).intValue();
            categoryRepository.findById(id).ifPresent(c -> {
                c.setOrder(order);
                categoryRepository.save(c);
            });
        }
        return null;
    }

    @Transactional
    public Category create(String userId, String name, String type, String icon, String color, String parentId) {
        if (categoryRepository.countByUserId(userId) >= 50) {
            throw new IllegalStateException("카테고리는 최대 50개까지 추가할 수 있습니다.");
        }
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("상위 카테고리를 찾을 수 없습니다."));
            if (parent.getParentId() != null) {
                throw new IllegalArgumentException("소분류는 2단계까지만 지원합니다.");
            }
        }
        Category c = new Category();
        c.setId(UUID.randomUUID().toString());
        c.setName(name);
        c.setType(type);
        c.setIcon(icon);
        c.setColor(color);
        c.setUserId(userId);
        c.setParentId(parentId);
        return categoryRepository.save(c);
    }

    @Transactional
    public Category update(String userId, String id, String name, String type, String icon, String color) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));
        if (!userId.equals(c.getUserId())) {
            throw new SecurityException("기본 카테고리는 수정할 수 없습니다.");
        }
        c.setName(name);
        c.setType(type);
        c.setIcon(icon);
        c.setColor(color);
        return categoryRepository.save(c);
    }

    @Transactional
    public String delete(String userId, String id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다."));

        if (!userId.equals(c.getUserId())) {
            // 기본 카테고리 → 소분류 삭제 후 숨김 처리
            List<Category> userChildren = categoryRepository.findByParentIdAndUserId(id, userId);
            if (!userChildren.isEmpty()) {
                categoryRepository.deleteAll(userChildren);
            }
            HiddenCategoryId hid = new HiddenCategoryId(userId, id);
            if (!hiddenCategoryRepository.existsById(hid)) {
                hiddenCategoryRepository.save(new HiddenCategory(userId, id));
            }
            return "카테고리가 숨겨졌습니다.";
        }

        // 내 카테고리 → 소분류 먼저 삭제
        categoryRepository.deleteByParentId(id);
        categoryRepository.deleteById(id);
        return "카테고리가 삭제되었습니다.";
    }

    @Transactional
    public void restore(String userId, String categoryId) {
        hiddenCategoryRepository.deleteByUserIdAndCategoryId(userId, categoryId);
    }
}
