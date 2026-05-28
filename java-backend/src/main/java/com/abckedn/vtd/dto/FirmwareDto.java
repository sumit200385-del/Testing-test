package com.abckedn.vtd.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record FirmwareDto(
        UUID id,
        String version,
        String deviceModel,
        String platform,
        String description,
        String releaseNotes,
        String status,
        UUID createdById,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TestingSessionDto> sessions,
        List<SignoffDto> signoffs
) {}
