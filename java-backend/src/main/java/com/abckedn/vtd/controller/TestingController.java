package com.abckedn.vtd.controller;

import com.abckedn.vtd.dto.StartTestingRequest;
import com.abckedn.vtd.dto.TestCaseDto;
import com.abckedn.vtd.dto.TestingSessionDto;
import com.abckedn.vtd.dto.UpdateTestCaseRequest;
import com.abckedn.vtd.security.UserPrincipal;
import com.abckedn.vtd.service.TestingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/testing")
@RequiredArgsConstructor
public class TestingController {

    private final TestingService testingService;

    @GetMapping("/firmware/{firmwareId}")
    public ResponseEntity<List<TestingSessionDto>> getSessionsByFirmware(@PathVariable UUID firmwareId) {
        return ResponseEntity.ok(testingService.getSessionsByFirmware(firmwareId));
    }

    @PostMapping("/start")
    public ResponseEntity<TestingSessionDto> startSession(
            @Valid @RequestBody StartTestingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TestingSessionDto session = testingService.startSession(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<TestingSessionDto> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(testingService.getSession(sessionId));
    }

    @PutMapping("/{sessionId}/case/{caseId}")
    public ResponseEntity<TestCaseDto> updateTestCase(
            @PathVariable UUID sessionId,
            @PathVariable UUID caseId,
            @Valid @RequestBody UpdateTestCaseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TestCaseDto updated = testingService.updateTestCase(sessionId, caseId, request, principal);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<TestingSessionDto> completeSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        TestingSessionDto completed = testingService.completeSession(sessionId, principal);
        return ResponseEntity.ok(completed);
    }
}
