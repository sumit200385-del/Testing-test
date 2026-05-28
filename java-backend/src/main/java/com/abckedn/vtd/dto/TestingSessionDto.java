package com.abckedn.vtd.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record TestingSessionDto(
        UUID id,
        UUID firmwareVersionId,
        String firmwareVersion,
        String deviceModel,
        int stage,
        UUID testerId,
        String testerName,
        String status,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        String notes,
        List<TestCaseDto> testCases
) {}
