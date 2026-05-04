package com.kakeibu.repository;

import com.kakeibu.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, String> {

    @Query("SELECT c FROM Category c WHERE c.userId IS NULL OR c.userId = :userId ORDER BY c.order ASC NULLS LAST, c.isDefault DESC, c.name ASC")
    List<Category> findSystemAndUserCategories(@Param("userId") String userId);

    long countByUserId(String userId);

    List<Category> findByParentIdAndUserId(String parentId, String userId);

    void deleteByParentId(String parentId);
}
