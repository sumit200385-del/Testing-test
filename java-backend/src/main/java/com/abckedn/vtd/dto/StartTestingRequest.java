package com.abckedn.vtd.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record StartTestingRequest(
        @NotNull(message = "Firmware ID is required")
        UUID firmwareId,

        @Min(value = 1, message = "Stage must be between 1 and 3")
        @Max(value = 3, message = "Stage must be between 1 and 3")
        int stage,

        String notes
) {}
