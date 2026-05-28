package com.abckedn.vtd.entity;

import com.abckedn.vtd.entity.enums.TestResult;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCase {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private TestingSession session;

    @Column(nullable = false)
    private String category;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TestResult result = TestResult.PENDING;

    @Column(name = "actual_value", columnDefinition = "TEXT")
    private String actualValue;

    @Column(name = "expected_value", columnDefinition = "TEXT")
    private String expectedValue;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "tested_at")
    private LocalDateTime testedAt;
}
