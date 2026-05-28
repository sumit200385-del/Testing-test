package com.abckedn.vtd.dto;

public record UpdateFirmwareRequest(
        String version,
        String deviceModel,
        String description,
        String releaseNotes
) {}
