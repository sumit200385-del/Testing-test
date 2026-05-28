package com.abckedn.vtd.controller;

import com.abckedn.vtd.dto.ChangeLogDto;
import com.abckedn.vtd.service.ChangeLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/changelog")
@RequiredArgsConstructor
public class ChangeLogController {

    private final ChangeLogService changeLogService;

    @GetMapping
    public ResponseEntity<List<ChangeLogDto>> getChangeLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        List<ChangeLogDto> logs = changeLogService.getChangeLogs(entityType, entityId, limit, offset);
        return ResponseEntity.ok(logs);
    }
}
