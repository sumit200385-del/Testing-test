package com.abckedn.vtd.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFirmwareRequest(
        @NotBlank(message = "Version is required")
        String version,

        @NotBlank(message = "Device model is required")
        String deviceModel,

        String description,

        String releaseNotes
) {}
