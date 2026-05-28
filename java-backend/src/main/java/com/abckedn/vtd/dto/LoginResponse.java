package com.abckedn.vtd.dto;

public record LoginResponse(
        String token,
        UserDto user
) {}
