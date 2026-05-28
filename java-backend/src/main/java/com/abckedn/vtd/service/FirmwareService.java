package com.abckedn.vtd.service;

import com.abckedn.vtd.dto.*;
import com.abckedn.vtd.entity.FirmwareVersion;
import com.abckedn.vtd.entity.Signoff;
import com.abckedn.vtd.entity.TestingSession;
import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.entity.enums.FirmwareStatus;
import com.abckedn.vtd.exception.BadRequestException;
import com.abckedn.vtd.exception.ResourceNotFoundException;
import com.abckedn.vtd.repository.FirmwareVersionRepository;
import com.abckedn.vtd.repository.SignoffRepository;
import com.abckedn.vtd.repository.TestCaseRepository;
import com.abckedn.vtd.repository.TestingSessionRepository;
import com.abckedn.vtd.repository.UserRepository;
import com.abckedn.vtd.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FirmwareService {

    private final FirmwareVersionRepository firmwareVersionRepository;
    private final UserRepository userRepository;
    private final TestingSessionRepository testingSessionRepository;
    private final SignoffRepository signoffRepository;
    private final TestCaseRepository testCaseRepository;
    private final ChangeLogService changeLogService;

    @Transactional(readOnly = true)
    public List<FirmwareDto> getAll() {
        List<FirmwareVersion> firmwares = firmwareVersionRepository.findAllWithCreatedBy();
        return firmwares.stream().map(f -> toDto(f, Collections.emptyList(), Collections.emptyList())).toList();
    }

    @Transactional(readOnly = true)
    public FirmwareDto getById(UUID id) {
        FirmwareVersion firmware = firmwareVersionRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("FirmwareVersion", id));

        List<TestingSession> sessions = testingSessionRepository.findByFirmwareVersionId(id);
        List<Signoff> signoffs = signoffRepository.findByFirmwareVersionId(id);

        List<TestingSessionDto> sessionDtos = sessions.stream()
                .map(s -> toSessionDto(s, testCaseRepository.findBySessionIdOrderByCategory(s.getId())))
                .toList();

        List<SignoffDto> signoffDtos = signoffs.stream().map(this::toSignoffDto).toList();

        return toDto(firmware, sessionDtos, signoffDtos);
    }

    @Transactional
    public FirmwareDto create(CreateFirmwareRequest request, UserPrincipal principal) {
        User createdBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        FirmwareVersion firmware = FirmwareVersion.builder()
                .version(request.version())
                .deviceModel(request.deviceModel())
                .description(request.description())
                .releaseNotes(request.releaseNotes())
                .createdBy(createdBy)
                .build();

        firmware = firmwareVersionRepository.save(firmware);

        changeLogService.log(
                "FirmwareVersion",
                firmware.getId().toString(),
                "CREATED",
                principal.getId(),
                "Firmware version created: " + firmware.getVersion(),
                null,
                firmware.getVersion()
        );

        return toDto(firmware, Collections.emptyList(), Collections.emptyList());
    }

    @Transactional
    public FirmwareDto update(UUID id, UpdateFirmwareRequest request, UserPrincipal principal) {
        FirmwareVersion firmware = firmwareVersionRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("FirmwareVersion", id));

        if (firmware.getStatus() != FirmwareStatus.DRAFT) {
            throw new BadRequestException("Firmware can only be updated in DRAFT status. Current status: " + firmware.getStatus());
        }

        String oldValue = firmware.getVersion();

        if (request.version() != null) firmware.setVersion(request.version());
        if (request.deviceModel() != null) firmware.setDeviceModel(request.deviceModel());
        if (request.description() != null) firmware.setDescription(request.description());
        if (request.releaseNotes() != null) firmware.setReleaseNotes(request.releaseNotes());

        firmware = firmwareVersionRepository.save(firmware);

        changeLogService.log(
                "FirmwareVersion",
                firmware.getId().toString(),
                "UPDATED",
                principal.getId(),
                "Firmware version updated",
                oldValue,
                firmware.getVersion()
        );

        return toDto(firmware, Collections.emptyList(), Collections.emptyList());
    }

    @Transactional
    public FirmwareDto submit(UUID id, UserPrincipal principal) {
        FirmwareVersion firmware = firmwareVersionRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new ResourceNotFoundException("FirmwareVersion", id));

        if (firmware.getStatus() != FirmwareStatus.DRAFT) {
            throw new BadRequestException("Firmware can only be submitted from DRAFT status. Current status: " + firmware.getStatus());
        }

        String oldStatus = firmware.getStatus().name();
        firmware.setStatus(FirmwareStatus.STAGE1_PENDING);
        firmware = firmwareVersionRepository.save(firmware);

        changeLogService.log(
                "FirmwareVersion",
                firmware.getId().toString(),
                "SUBMITTED",
                principal.getId(),
                "Firmware submitted for Stage 1 testing",
                oldStatus,
                FirmwareStatus.STAGE1_PENDING.name()
        );

        return toDto(firmware, Collections.emptyList(), Collections.emptyList());
    }

    public FirmwareDto toDto(FirmwareVersion firmware, List<TestingSessionDto> sessions, List<SignoffDto> signoffs) {
        return new FirmwareDto(
                firmware.getId(),
                firmware.getVersion(),
                firmware.getDeviceModel(),
                firmware.getPlatform(),
                firmware.getDescription(),
                firmware.getReleaseNotes(),
                firmware.getStatus().name(),
                firmware.getCreatedBy().getId(),
                firmware.getCreatedBy().getName(),
                firmware.getCreatedAt(),
                firmware.getUpdatedAt(),
                sessions,
                signoffs
        );
    }

    private TestingSessionDto toSessionDto(TestingSession session, List<com.abckedn.vtd.entity.TestCase> testCases) {
        List<TestCaseDto> caseDtos = testCases.stream().map(tc -> new TestCaseDto(
                tc.getId(),
                tc.getSession().getId(),
                tc.getCategory(),
                tc.getTestName(),
                tc.getDescription(),
                tc.getResult().name(),
                tc.getActualValue(),
                tc.getExpectedValue(),
                tc.getRemarks(),
                tc.getTestedAt()
        )).toList();

        return new TestingSessionDto(
                session.getId(),
                session.getFirmwareVersion().getId(),
                session.getFirmwareVersion().getVersion(),
                session.getFirmwareVersion().getDeviceModel(),
                session.getStage(),
                session.getTester().getId(),
                session.getTester().getName(),
                session.getStatus().name(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getNotes(),
                caseDtos
        );
    }

    private SignoffDto toSignoffDto(Signoff signoff) {
        return new SignoffDto(
                signoff.getId(),
                signoff.getFirmwareVersion().getId(),
                signoff.getStage(),
                signoff.getSession().getId(),
                signoff.getSignedBy().getId(),
                signoff.getSignedBy().getName(),
                signoff.getSignedBy().getRole().name(),
                signoff.getDecision().name(),
                signoff.getComments(),
                signoff.getSignedAt()
        );
    }
}
