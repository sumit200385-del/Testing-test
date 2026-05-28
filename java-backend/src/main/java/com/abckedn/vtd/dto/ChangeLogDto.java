package com.abckedn.vtd.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChangeLogDto(
        UUID id,
        String entityType,
        String entityId,
        String action,
        UUID changedById,
        String changedByName,
        LocalDateTime changedAt,
        String oldValue,
        String newValue,
        String details
) {}
