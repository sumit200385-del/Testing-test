package com.abckedn.vtd.repository;

import com.abckedn.vtd.entity.ChangeLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeLogRepository extends JpaRepository<ChangeLog, UUID> {

    @Query("SELECT c FROM ChangeLog c JOIN FETCH c.changedBy WHERE c.entityType = :entityType AND c.entityId = :entityId ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityTypeAndEntityId(String entityType, String entityId, Pageable pageable);

    @Query("SELECT c FROM ChangeLog c JOIN FETCH c.changedBy WHERE c.entityType = :entityType ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityType(String entityType, Pageable pageable);

    @Query("SELECT c FROM ChangeLog c JOIN FETCH c.changedBy WHERE c.entityId = :entityId ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityId(String entityId, Pageable pageable);

    @Query("SELECT c FROM ChangeLog c JOIN FETCH c.changedBy ORDER BY c.changedAt DESC")
    List<ChangeLog> findAllWithDetails(Pageable pageable);
}
