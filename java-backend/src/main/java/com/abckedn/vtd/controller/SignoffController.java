package com.abckedn.vtd.controller;

import com.abckedn.vtd.dto.SignoffDto;
import com.abckedn.vtd.dto.SignoffRequest;
import com.abckedn.vtd.security.UserPrincipal;
import com.abckedn.vtd.service.SignoffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/signoff")
@RequiredArgsConstructor
public class SignoffController {

    private final SignoffService signoffService;

    @PostMapping("/sign")
    public ResponseEntity<SignoffDto> sign(
            @Valid @RequestBody SignoffRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SignoffDto signoff = signoffService.sign(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(signoff);
    }

    @GetMapping("/firmware/{firmwareId}")
    public ResponseEntity<List<SignoffDto>> getByFirmware(@PathVariable UUID firmwareId) {
        return ResponseEntity.ok(signoffService.getByFirmware(firmwareId));
    }
}
