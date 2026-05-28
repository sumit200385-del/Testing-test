package com.abckedn.vtd.service;

import com.abckedn.vtd.dto.ChangeLogDto;
import com.abckedn.vtd.entity.ChangeLog;
import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.exception.ResourceNotFoundException;
import com.abckedn.vtd.repository.ChangeLogRepository;
import com.abckedn.vtd.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChangeLogService {

    private final ChangeLogRepository changeLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(String entityType, String entityId, String action,
                    UUID userId, String details, String oldValue, String newValue) {
        User changedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        ChangeLog changeLog = ChangeLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .changedBy(changedBy)
                .details(details)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();

        changeLogRepository.save(changeLog);
    }

    @Transactional(readOnly = true)
    public List<ChangeLogDto> getChangeLogs(String entityType, String entityId, int limit, int offset) {
        Pageable pageable = PageRequest.of(offset / Math.max(limit, 1), Math.max(limit, 1));

        List<ChangeLog> logs;

        if (StringUtils.hasText(entityType) && StringUtils.hasText(entityId)) {
            logs = changeLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        } else if (StringUtils.hasText(entityType)) {
            logs = changeLogRepository.findByEntityType(entityType, pageable);
        } else if (StringUtils.hasText(entityId)) {
            logs = changeLogRepository.findByEntityId(entityId, pageable);
        } else {
            logs = changeLogRepository.findAllWithDetails(pageable);
        }

        return logs.stream().map(this::toDto).toList();
    }

    public ChangeLogDto toDto(ChangeLog log) {
        return new ChangeLogDto(
                log.getId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getChangedBy().getId(),
                log.getChangedBy().getName(),
                log.getChangedAt(),
                log.getOldValue(),
                log.getNewValue(),
                log.getDetails()
        );
    }
}
