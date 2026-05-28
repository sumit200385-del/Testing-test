package com.abckedn.vtd.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateTestCaseRequest(
        @NotBlank(message = "Result is required")
        String result,

        String actualValue,

        String remarks
) {}
