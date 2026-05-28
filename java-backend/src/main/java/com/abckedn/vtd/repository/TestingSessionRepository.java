package com.abckedn.vtd.repository;

import com.abckedn.vtd.entity.TestingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TestingSessionRepository extends JpaRepository<TestingSession, UUID> {

    @Query("SELECT s FROM TestingSession s JOIN FETCH s.tester JOIN FETCH s.firmwareVersion WHERE s.firmwareVersion.id = :firmwareId ORDER BY s.startedAt DESC")
    List<TestingSession> findByFirmwareVersionId(UUID firmwareId);

    @Query("SELECT s FROM TestingSession s JOIN FETCH s.tester JOIN FETCH s.firmwareVersion WHERE s.id = :id")
    Optional<TestingSession> findByIdWithDetails(UUID id);

    @Query("SELECT s FROM TestingSession s JOIN FETCH s.tester JOIN FETCH s.firmwareVersion ORDER BY s.startedAt DESC")
    List<TestingSession> findAllWithDetails();
}
