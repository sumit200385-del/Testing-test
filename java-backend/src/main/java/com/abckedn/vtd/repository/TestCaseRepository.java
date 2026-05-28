package com.abckedn.vtd.repository;

import com.abckedn.vtd.entity.TestCase;
import com.abckedn.vtd.entity.enums.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {

    List<TestCase> findBySessionIdOrderByCategory(UUID sessionId);

    boolean existsBySessionIdAndResult(UUID sessionId, TestResult result);
}
