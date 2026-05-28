package com.abckedn.vtd.controller;

import com.abckedn.vtd.dto.CreateFirmwareRequest;
import com.abckedn.vtd.dto.FirmwareDto;
import com.abckedn.vtd.dto.UpdateFirmwareRequest;
import com.abckedn.vtd.security.UserPrincipal;
import com.abckedn.vtd.service.FirmwareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/firmware")
@RequiredArgsConstructor
public class FirmwareController {

    private final FirmwareService firmwareService;

    @GetMapping
    public ResponseEntity<List<FirmwareDto>> getAll() {
        return ResponseEntity.ok(firmwareService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FirmwareDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(firmwareService.getById(id));
    }

    @PostMapping
    public ResponseEntity<FirmwareDto> create(
            @Valid @RequestBody CreateFirmwareRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FirmwareDto created = firmwareService.create(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FirmwareDto> update(
            @PathVariable UUID id,
            @RequestBody UpdateFirmwareRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        FirmwareDto updated = firmwareService.update(id, request, principal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<FirmwareDto> submit(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        FirmwareDto submitted = firmwareService.submit(id, principal);
        return ResponseEntity.ok(submitted);
    }
}
