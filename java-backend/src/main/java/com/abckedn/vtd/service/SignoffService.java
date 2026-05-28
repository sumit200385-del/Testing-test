package com.abckedn.vtd.service;

import com.abckedn.vtd.dto.SignoffDto;
import com.abckedn.vtd.dto.SignoffRequest;
import com.abckedn.vtd.entity.FirmwareVersion;
import com.abckedn.vtd.entity.Signoff;
import com.abckedn.vtd.entity.TestingSession;
import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.entity.enums.*;
import com.abckedn.vtd.exception.BadRequestException;
import com.abckedn.vtd.exception.ResourceNotFoundException;
import com.abckedn.vtd.repository.FirmwareVersionRepository;
import com.abckedn.vtd.repository.SignoffRepository;
import com.abckedn.vtd.repository.TestingSessionRepository;
import com.abckedn.vtd.repository.UserRepository;
import com.abckedn.vtd.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignoffService {

    private final SignoffRepository signoffRepository;
    private final FirmwareVersionRepository firmwareVersionRepository;
    private final TestingSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ChangeLogService changeLogService;

    @Transactional
    public SignoffDto sign(SignoffRequest request, UserPrincipal principal) {
        FirmwareVersion firmware = firmwareVersionRepository.findByIdWithCreatedBy(request.firmwareId())
                .orElseThrow(() -> new ResourceNotFoundException("FirmwareVersion", request.firmwareId()));

        TestingSession session = sessionRepository.findByIdWithDetails(request.sessionId())
                .orElseThrow(() -> new ResourceNotFoundException("TestingSession", request.sessionId()));

        User signedBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        // Validate role permission per stage
        validateRoleForStage(principal.getRole(), request.stage());

        // Validate session is COMPLETED
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new BadRequestException("Session must be COMPLETED before sign-off. Current status: " + session.getStatus());
        }

        // Validate session belongs to this firmware and stage
        if (!session.getFirmwareVersion().getId().equals(request.firmwareId())) {
            throw new BadRequestException("Session does not belong to the specified firmware");
        }

        if (session.getStage() != request.stage()) {
            throw new BadRequestException("Session stage (" + session.getStage() + ") does not match sign-off stage (" + request.stage() + ")");
        }

        SignoffDecision decision;
        try {
            decision = SignoffDecision.valueOf(request.decision().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid decision: " + request.decision() + ". Valid values: APPROVED, REJECTED");
        }

        Signoff signoff = Signoff.builder()
                .firmwareVersion(firmware)
                .stage(request.stage())
                .session(session)
                .signedBy(signedBy)
                .decision(decision)
                .comments(request.comments())
                .build();

        signoff = signoffRepository.save(signoff);

        // Update firmware status based on decision
        String oldStatus = firmware.getStatus().name();
        FirmwareStatus newStatus = computeNewFirmwareStatus(decision, request.stage());
        firmware.setStatus(newStatus);
        firmwareVersionRepository.save(firmware);

        // Update session status
        session.setStatus(SessionStatus.SIGNED_OFF);
        sessionRepository.save(session);

        changeLogService.log(
                "Signoff",
                signoff.getId().toString(),
                decision.name(),
                principal.getId(),
                "Stage " + request.stage() + " sign-off " + decision.name() + " for firmware: " + firmware.getVersion(),
                oldStatus,
                newStatus.name()
        );

        return new SignoffDto(
                signoff.getId(),
                firmware.getId(),
                signoff.getStage(),
                session.getId(),
                signedBy.getId(),
                signedBy.getName(),
                signedBy.getRole().name(),
                signoff.getDecision().name(),
                signoff.getComments(),
                signoff.getSignedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<SignoffDto> getByFirmware(UUID firmwareId) {
        List<Signoff> signoffs = signoffRepository.findByFirmwareVersionId(firmwareId);
        return signoffs.stream().map(this::toDto).toList();
    }

    private void validateRoleForStage(UserRole role, int stage) {
        boolean allowed = switch (stage) {
            case 1 -> role == UserRole.RD_HEAD || role == UserRole.ADMIN;
            case 2 -> role == UserRole.OPERATIONS || role == UserRole.ADMIN;
            case 3 -> role == UserRole.SALES || role == UserRole.ADMIN;
            default -> false;
        };

        if (!allowed) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Role " + role + " is not authorized to sign off stage " + stage + " testing"
            );
        }
    }

    private FirmwareStatus computeNewFirmwareStatus(SignoffDecision decision, int stage) {
        if (decision == SignoffDecision.APPROVED) {
            return switch (stage) {
                case 1 -> FirmwareStatus.STAGE2_PENDING;
                case 2 -> FirmwareStatus.STAGE3_PENDING;
                case 3 -> FirmwareStatus.APPROVED;
                default -> throw new BadRequestException("Invalid stage: " + stage);
            };
        } else {
            // REJECTED
            return switch (stage) {
                case 1 -> FirmwareStatus.STAGE1_FAILED;
                case 2 -> FirmwareStatus.STAGE2_FAILED;
                case 3 -> FirmwareStatus.REJECTED;
                default -> throw new BadRequestException("Invalid stage: " + stage);
            };
        }
    }

    private SignoffDto toDto(Signoff signoff) {
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
