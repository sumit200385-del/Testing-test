package com.abckedn.vtd.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SignoffDto(
        UUID id,
        UUID firmwareVersionId,
        int stage,
        UUID sessionId,
        UUID signedById,
        String signedByName,
        String signedByRole,
        String decision,
        String comments,
        LocalDateTime signedAt
) {}
