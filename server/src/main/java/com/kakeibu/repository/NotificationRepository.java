package com.kakeibu.repository;

import com.kakeibu.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    @Query(value = "SELECT n.* FROM \"Notification\" n WHERE n.userId = :userId AND (:status IS NULL OR n.status = :status) ORDER BY n.createdAt DESC LIMIT 50", nativeQuery = true)
    List<Notification> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") String status);

    long countByUserIdAndStatus(String userId, String status);

    Optional<Notification> findByIdAndUserId(String id, String userId);
}
