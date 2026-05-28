package com.abckedn.vtd.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TestCaseDto(
        UUID id,
        UUID sessionId,
        String category,
        String testName,
        String description,
        String result,
        String actualValue,
        String expectedValue,
        String remarks,
        LocalDateTime testedAt
) {}
