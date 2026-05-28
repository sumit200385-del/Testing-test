package com.abckedn.vtd.entity;

import com.abckedn.vtd.entity.enums.SignoffDecision;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "signoffs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Signoff {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firmware_version_id", nullable = false)
    private FirmwareVersion firmwareVersion;

    @Column(nullable = false)
    private int stage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private TestingSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_by", nullable = false)
    private User signedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignoffDecision decision;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @CreationTimestamp
    @Column(name = "signed_at", updatable = false)
    private LocalDateTime signedAt;
}
