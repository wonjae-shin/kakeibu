package com.kakeibu.repository;

import com.kakeibu.entity.HiddenCategory;
import com.kakeibu.entity.HiddenCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HiddenCategoryRepository extends JpaRepository<HiddenCategory, HiddenCategoryId> {
    List<HiddenCategory> findByIdUserId(String userId);

    @Modifying
    @Query("DELETE FROM HiddenCategory h WHERE h.id.userId = :userId AND h.id.categoryId = :categoryId")
    void deleteByUserIdAndCategoryId(@Param("userId") String userId, @Param("categoryId") String categoryId);
}
