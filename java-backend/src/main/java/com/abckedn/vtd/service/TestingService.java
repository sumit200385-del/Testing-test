package com.abckedn.vtd.service;

import com.abckedn.vtd.dto.StartTestingRequest;
import com.abckedn.vtd.dto.TestCaseDto;
import com.abckedn.vtd.dto.TestingSessionDto;
import com.abckedn.vtd.dto.UpdateTestCaseRequest;
import com.abckedn.vtd.entity.FirmwareVersion;
import com.abckedn.vtd.entity.TestCase;
import com.abckedn.vtd.entity.TestingSession;
import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.entity.enums.FirmwareStatus;
import com.abckedn.vtd.entity.enums.SessionStatus;
import com.abckedn.vtd.entity.enums.TestResult;
import com.abckedn.vtd.exception.BadRequestException;
import com.abckedn.vtd.exception.ResourceNotFoundException;
import com.abckedn.vtd.repository.FirmwareVersionRepository;
import com.abckedn.vtd.repository.TestCaseRepository;
import com.abckedn.vtd.repository.TestingSessionRepository;
import com.abckedn.vtd.repository.UserRepository;
import com.abckedn.vtd.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TestingService {

    private final TestingSessionRepository sessionRepository;
    private final TestCaseRepository testCaseRepository;
    private final FirmwareVersionRepository firmwareVersionRepository;
    private final UserRepository userRepository;
    private final ChangeLogService changeLogService;

    // ===================== Test Case Templates =====================

    record TestCaseTemplate(String category, String testName, String description, String expectedValue) {}

    private static final List<TestCaseTemplate> STAGE1_TEMPLATES = List.of(
            // Device Connection (4)
            new TestCaseTemplate("Device Connection", "SIM Card Detection", "Verify that the VTD device detects the SIM card on boot", "SIM Detected successfully"),
            new TestCaseTemplate("Device Connection", "Network Registration", "Verify the device registers on the cellular network", "Network registered with signal strength > -90dBm"),
            new TestCaseTemplate("Device Connection", "Server Connectivity", "Verify the device can reach the tracking server", "TCP connection established within 30 seconds"),
            new TestCaseTemplate("Device Connection", "Reconnection After Drop", "Simulate network drop and verify automatic reconnection", "Device reconnects within 60 seconds"),

            // Packet Validation (6)
            new TestCaseTemplate("Packet Validation", "Packet Format Verification", "Verify outgoing packets follow the defined protocol format", "Packets conform to abckedn protocol v2 format"),
            new TestCaseTemplate("Packet Validation", "Packet Sequence Number", "Verify packet sequence numbers increment correctly", "Sequential numbering without gaps"),
            new TestCaseTemplate("Packet Validation", "Packet CRC Check", "Verify CRC checksum is correctly computed in each packet", "CRC matches computed value for all packets"),
            new TestCaseTemplate("Packet Validation", "Packet Interval", "Verify packets are sent at configured intervals", "Packets sent every 30 seconds (configurable)"),
            new TestCaseTemplate("Packet Validation", "Packet Acknowledgment", "Verify device handles server acknowledgment correctly", "Device receives ACK and does not resend acknowledged packets"),
            new TestCaseTemplate("Packet Validation", "Duplicate Packet Handling", "Simulate duplicate packets and verify deduplication", "Duplicate packets are rejected or logged without processing"),

            // CSV Data Validation (5)
            new TestCaseTemplate("CSV Data Validation", "GPS Coordinates in CSV", "Verify GPS lat/long are correctly included in CSV output", "Lat/Long precision to 6 decimal places"),
            new TestCaseTemplate("CSV Data Validation", "Timestamp Format", "Verify timestamp field in CSV follows ISO 8601 format", "Timestamp in UTC ISO 8601 format"),
            new TestCaseTemplate("CSV Data Validation", "Speed Field Accuracy", "Verify speed value in CSV matches GPS-derived speed", "Speed within ±2 km/h of GPS-derived value"),
            new TestCaseTemplate("CSV Data Validation", "Heading/Direction Field", "Verify heading field correctly indicates direction of movement", "Heading in degrees 0-359 relative to true north"),
            new TestCaseTemplate("CSV Data Validation", "Odometer Field", "Verify odometer accumulates correctly across trips", "Odometer increments accurately within ±1%"),

            // Simulated Alert Testing (7)
            new TestCaseTemplate("Simulated Alert Testing", "Overspeed Alert", "Simulate vehicle speed exceeding threshold and verify alert", "Alert packet sent within 5 seconds of threshold breach"),
            new TestCaseTemplate("Simulated Alert Testing", "Harsh Braking Alert", "Simulate harsh braking event and verify alert generation", "Harsh braking detected at deceleration > 0.4g"),
            new TestCaseTemplate("Simulated Alert Testing", "Harsh Acceleration Alert", "Simulate harsh acceleration and verify alert generation", "Harsh acceleration detected at > 0.4g"),
            new TestCaseTemplate("Simulated Alert Testing", "Tamper Alert", "Simulate device tamper (disconnection) and verify alert", "Tamper alert sent within 3 seconds of event"),
            new TestCaseTemplate("Simulated Alert Testing", "Low Battery Alert", "Simulate low internal battery and verify alert", "Alert triggered below 20% battery level"),
            new TestCaseTemplate("Simulated Alert Testing", "Ignition On/Off Alert", "Simulate ignition events and verify corresponding alerts", "Ignition on/off events captured with accurate timestamp"),
            new TestCaseTemplate("Simulated Alert Testing", "Geofence Breach Alert (Simulated)", "Simulate geofence boundary breach and verify alert packet", "Geofence breach alert sent immediately upon exit/entry"),

            // Packet Accuracy (4)
            new TestCaseTemplate("Packet Accuracy", "GPS Fix Accuracy", "Verify GPS fix precision under open sky conditions", "GPS accuracy within 5 meters CEP under open sky"),
            new TestCaseTemplate("Packet Accuracy", "Speed Accuracy in Packet", "Compare packet speed value against reference speed", "Speed deviation less than ±2 km/h"),
            new TestCaseTemplate("Packet Accuracy", "Altitude Accuracy", "Verify altitude field in packet against known elevation", "Altitude within ±10 meters of known reference"),
            new TestCaseTemplate("Packet Accuracy", "Satellite Count Reporting", "Verify satellite count field in packet", "Satellite count accurately reported (minimum 4 for valid fix)"),

            // Configuration Testing (3)
            new TestCaseTemplate("Configuration Testing", "Remote Configuration via SMS", "Send configuration SMS and verify device applies settings", "Configuration applied within 60 seconds of SMS receipt"),
            new TestCaseTemplate("Configuration Testing", "Configuration Persistence After Reboot", "Verify configurations persist after power cycle", "All configurations retained after reboot"),
            new TestCaseTemplate("Configuration Testing", "APN Configuration", "Verify APN settings can be updated remotely", "APN updated and connection re-established with new APN"),

            // FOTA Testing (4)
            new TestCaseTemplate("FOTA Testing", "FOTA Initiation", "Initiate firmware update over the air and verify download starts", "FOTA download initiated within 30 seconds of command"),
            new TestCaseTemplate("FOTA Testing", "FOTA Download Integrity", "Verify firmware download checksum matches expected", "Download checksum matches server-provided hash"),
            new TestCaseTemplate("FOTA Testing", "FOTA Installation", "Verify new firmware installs and device reboots successfully", "Device reboots and reports new firmware version"),
            new TestCaseTemplate("FOTA Testing", "FOTA Rollback on Failure", "Simulate failed FOTA and verify rollback to previous version", "Device rolls back to previous firmware version on install failure")
    );

    private static final List<TestCaseTemplate> STAGE2_TEMPLATES = List.of(
            // Vehicle Movement (4)
            new TestCaseTemplate("Vehicle Movement", "Real Movement Tracking", "Verify device tracks vehicle position during real road drive", "Position updates within 30 seconds during movement"),
            new TestCaseTemplate("Vehicle Movement", "Stop Detection", "Verify device correctly detects vehicle stop events", "Stop detected within 10 seconds of vehicle halting"),
            new TestCaseTemplate("Vehicle Movement", "Trip Start/End Detection", "Verify accurate detection of trip start and end", "Trip boundaries match actual ignition events"),
            new TestCaseTemplate("Vehicle Movement", "Parked Vehicle Behavior", "Verify device behavior when vehicle is parked for extended period", "Heartbeat packets sent every 5 minutes when parked"),

            // Driving Behavior (5)
            new TestCaseTemplate("Driving Behavior", "Overspeed Detection on Road", "Verify overspeed detection during actual road testing", "Alert triggered when speed exceeds configured threshold"),
            new TestCaseTemplate("Driving Behavior", "Harsh Braking on Road", "Verify harsh braking detection on actual road surface", "Event captured with correct timestamp and coordinates"),
            new TestCaseTemplate("Driving Behavior", "Harsh Acceleration on Road", "Verify harsh acceleration detection during real drive", "Event captured with correct timestamp and coordinates"),
            new TestCaseTemplate("Driving Behavior", "Sharp Cornering Detection", "Verify sharp cornering/swerving event detection", "Cornering event detected at lateral acceleration > 0.4g"),
            new TestCaseTemplate("Driving Behavior", "Idling Detection", "Verify engine idling detection when vehicle is stationary with engine on", "Idling alert after configured threshold (default 5 minutes)"),

            // Ignition & Vehicle State (4)
            new TestCaseTemplate("Ignition & Vehicle State", "Ignition On Detection", "Verify ignition on event is captured correctly", "Ignition on event logged within 5 seconds with coordinates"),
            new TestCaseTemplate("Ignition & Vehicle State", "Ignition Off Detection", "Verify ignition off event is captured correctly", "Ignition off event logged within 5 seconds with coordinates"),
            new TestCaseTemplate("Ignition & Vehicle State", "ACC Detection", "Verify ACC (Accessory) state detection", "ACC state change captured and reported accurately"),
            new TestCaseTemplate("Ignition & Vehicle State", "Engine Hours Tracking", "Verify cumulative engine hours are tracked correctly", "Engine hours increment accurately during ignition on periods"),

            // Network & Communication (3)
            new TestCaseTemplate("Network & Communication", "Data Transmission on 4G/LTE", "Verify data transmission over 4G/LTE network", "All packets delivered with latency < 2 seconds"),
            new TestCaseTemplate("Network & Communication", "Fallback to 2G/3G", "Verify graceful fallback when 4G is unavailable", "Device falls back and maintains connectivity on 2G/3G"),
            new TestCaseTemplate("Network & Communication", "Data Buffering During No Network", "Verify data is buffered when network is unavailable and sent on reconnect", "Buffered data transmitted in order upon reconnection"),

            // GPS Accuracy (4)
            new TestCaseTemplate("GPS Accuracy", "Urban Canyon GPS Performance", "Verify GPS performance in urban environments with tall buildings", "GPS fix maintained with accuracy < 15 meters in urban areas"),
            new TestCaseTemplate("GPS Accuracy", "Highway GPS Tracking", "Verify GPS tracking accuracy at highway speeds", "Position accuracy within 5 meters on open highway"),
            new TestCaseTemplate("GPS Accuracy", "GPS Cold Start Time", "Measure time to first fix after cold start", "Cold start fix acquired within 60 seconds under open sky"),
            new TestCaseTemplate("GPS Accuracy", "GPS Warm Start Time", "Measure time to first fix after warm start (recent almanac)", "Warm start fix acquired within 15 seconds"),

            // Environmental (3)
            new TestCaseTemplate("Environmental", "High Temperature Operation", "Test device operation at high ambient temperature (60°C)", "Device operates normally at 60°C for 2 hours"),
            new TestCaseTemplate("Environmental", "Low Temperature Operation", "Test device operation at low ambient temperature (-10°C)", "Device operates normally at -10°C for 2 hours"),
            new TestCaseTemplate("Environmental", "Vibration Resistance", "Test device under vehicle vibration conditions", "No packet loss or disconnection during vibration test"),

            // Real-Time Server (3)
            new TestCaseTemplate("Real-Time Server", "Live Tracking on Dashboard", "Verify real-time position updates appear on tracking dashboard", "Dashboard reflects position within 30 seconds of update"),
            new TestCaseTemplate("Real-Time Server", "Alert Notification Delivery", "Verify alerts are delivered to server and notification system", "Alerts appear in dashboard within 10 seconds"),
            new TestCaseTemplate("Real-Time Server", "Server-Side Data Integrity", "Verify data stored on server matches device-reported data", "100% data integrity between device and server records"),

            // Power & Battery (3)
            new TestCaseTemplate("Power & Battery", "Main Power Consumption", "Measure device power consumption during active tracking", "Power consumption within specified limits (max 500mA at 12V)"),
            new TestCaseTemplate("Power & Battery", "Backup Battery Functionality", "Verify backup battery activates on main power disconnect", "Device continues operating on backup battery for minimum 4 hours"),
            new TestCaseTemplate("Power & Battery", "Power Cut Alert", "Verify power cut alert is sent when main power is disconnected", "Alert sent within 5 seconds of power disconnect"),

            // Long-Duration Observation (2)
            new TestCaseTemplate("Long-Duration Observation", "24-Hour Continuous Operation", "Run device for 24 hours and verify stability", "No crashes, reboots, or data gaps during 24-hour test"),
            new TestCaseTemplate("Long-Duration Observation", "Memory Leak Check", "Monitor device memory usage over extended operation", "Memory usage stable over 24-hour period without continuous increase"),

            // Geo-Fence & Alert (Field) (3)
            new TestCaseTemplate("Geo-Fence & Alert (Field)", "Geofence Entry Alert", "Drive vehicle into defined geofence and verify entry alert", "Entry alert received within 30 seconds of boundary crossing"),
            new TestCaseTemplate("Geo-Fence & Alert (Field)", "Geofence Exit Alert", "Drive vehicle out of defined geofence and verify exit alert", "Exit alert received within 30 seconds of boundary crossing"),
            new TestCaseTemplate("Geo-Fence & Alert (Field)", "Multiple Geofence Zones", "Test device with multiple overlapping geofence zones", "All zone transitions correctly identified and reported")
    );

    private static final List<TestCaseTemplate> STAGE3_TEMPLATES = List.of(
            // Tracking Application Review (5)
            new TestCaseTemplate("Tracking Application Review", "Historical Trip Playback", "Verify historical trip data can be replayed on the tracking application", "Trip playback accurate with no missing waypoints"),
            new TestCaseTemplate("Tracking Application Review", "Report Generation", "Verify automated reports are generated correctly from device data", "Reports generated with correct data matching device logs"),
            new TestCaseTemplate("Tracking Application Review", "Alert History Display", "Verify all historical alerts are displayed correctly in application", "All alerts shown with correct timestamps and event details"),
            new TestCaseTemplate("Tracking Application Review", "Multi-Vehicle Dashboard", "Verify tracking application handles multiple vehicles simultaneously", "All vehicles tracked without data cross-contamination"),
            new TestCaseTemplate("Tracking Application Review", "User Access Control", "Verify application enforces correct user role permissions", "Role-based access control enforced for all data views"),

            // Field Testing Validation (3)
            new TestCaseTemplate("Field Testing Validation", "End-to-End Data Flow Validation", "Validate complete data flow from device to application dashboard", "Data flows without loss from device through server to dashboard"),
            new TestCaseTemplate("Field Testing Validation", "Customer Environment Installation", "Install device in customer vehicle type and verify compatibility", "Device installs successfully and operates in target vehicle"),
            new TestCaseTemplate("Field Testing Validation", "Interoperability with Existing Fleet", "Verify new firmware works with existing fleet management integrations", "No disruption to existing fleet management system integrations"),

            // Compliance Check (2)
            new TestCaseTemplate("Compliance Check", "Regulatory Compliance Verification", "Verify device meets applicable regional regulatory requirements", "All regulatory requirements satisfied with documentation"),
            new TestCaseTemplate("Compliance Check", "Data Privacy Compliance", "Verify device and platform comply with data privacy regulations", "Data handling compliant with applicable privacy regulations")
    );

    // ===================== Service Methods =====================

    @Transactional
    public TestingSessionDto startSession(StartTestingRequest request, UserPrincipal principal) {
        FirmwareVersion firmware = firmwareVersionRepository.findByIdWithCreatedBy(request.firmwareId())
                .orElseThrow(() -> new ResourceNotFoundException("FirmwareVersion", request.firmwareId()));

        FirmwareStatus requiredStatus = switch (request.stage()) {
            case 1 -> FirmwareStatus.STAGE1_PENDING;
            case 2 -> FirmwareStatus.STAGE2_PENDING;
            case 3 -> FirmwareStatus.STAGE3_PENDING;
            default -> throw new BadRequestException("Invalid stage: " + request.stage());
        };

        if (firmware.getStatus() != requiredStatus) {
            throw new BadRequestException(
                    "Firmware must be in " + requiredStatus + " status to start stage " + request.stage() +
                    " testing. Current status: " + firmware.getStatus()
            );
        }

        User tester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getId()));

        TestingSession session = TestingSession.builder()
                .firmwareVersion(firmware)
                .stage(request.stage())
                .tester(tester)
                .notes(request.notes())
                .build();

        session = sessionRepository.save(session);

        List<TestCaseTemplate> templates = switch (request.stage()) {
            case 1 -> STAGE1_TEMPLATES;
            case 2 -> STAGE2_TEMPLATES;
            case 3 -> STAGE3_TEMPLATES;
            default -> throw new BadRequestException("Invalid stage: " + request.stage());
        };

        List<TestCase> testCases = new ArrayList<>();
        for (TestCaseTemplate template : templates) {
            TestCase tc = TestCase.builder()
                    .session(session)
                    .category(template.category())
                    .testName(template.testName())
                    .description(template.description())
                    .expectedValue(template.expectedValue())
                    .build();
            testCases.add(tc);
        }

        testCaseRepository.saveAll(testCases);

        changeLogService.log(
                "TestingSession",
                session.getId().toString(),
                "STARTED",
                principal.getId(),
                "Stage " + request.stage() + " testing session started for firmware: " + firmware.getVersion(),
                null,
                SessionStatus.IN_PROGRESS.name()
        );

        List<TestCaseDto> caseDtos = testCases.stream().map(tc -> new TestCaseDto(
                tc.getId(),
                session.getId(),
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
                firmware.getId(),
                firmware.getVersion(),
                firmware.getDeviceModel(),
                session.getStage(),
                tester.getId(),
                tester.getName(),
                session.getStatus().name(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getNotes(),
                caseDtos
        );
    }

    @Transactional(readOnly = true)
    public List<TestingSessionDto> getSessionsByFirmware(UUID firmwareId) {
        List<TestingSession> sessions = sessionRepository.findByFirmwareVersionId(firmwareId);
        return sessions.stream().map(s -> {
            List<TestCase> cases = testCaseRepository.findBySessionIdOrderByCategory(s.getId());
            return toDto(s, cases);
        }).toList();
    }

    @Transactional(readOnly = true)
    public TestingSessionDto getSession(UUID sessionId) {
        TestingSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TestingSession", sessionId));
        List<TestCase> cases = testCaseRepository.findBySessionIdOrderByCategory(sessionId);
        return toDto(session, cases);
    }

    @Transactional
    public TestCaseDto updateTestCase(UUID sessionId, UUID caseId, UpdateTestCaseRequest request, UserPrincipal principal) {
        TestingSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TestingSession", sessionId));

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BadRequestException("Session is not in progress. Current status: " + session.getStatus());
        }

        TestCase testCase = testCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase", caseId));

        if (!testCase.getSession().getId().equals(sessionId)) {
            throw new BadRequestException("Test case does not belong to this session");
        }

        String oldResult = testCase.getResult().name();

        TestResult newResult;
        try {
            newResult = TestResult.valueOf(request.result().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid test result: " + request.result() + ". Valid values: PASS, FAIL, SKIP, PENDING");
        }

        testCase.setResult(newResult);
        testCase.setActualValue(request.actualValue());
        testCase.setRemarks(request.remarks());
        testCase.setTestedAt(LocalDateTime.now());

        testCase = testCaseRepository.save(testCase);

        changeLogService.log(
                "TestCase",
                testCase.getId().toString(),
                "UPDATED",
                principal.getId(),
                "Test case updated: " + testCase.getTestName(),
                oldResult,
                newResult.name()
        );

        return new TestCaseDto(
                testCase.getId(),
                sessionId,
                testCase.getCategory(),
                testCase.getTestName(),
                testCase.getDescription(),
                testCase.getResult().name(),
                testCase.getActualValue(),
                testCase.getExpectedValue(),
                testCase.getRemarks(),
                testCase.getTestedAt()
        );
    }

    @Transactional
    public TestingSessionDto completeSession(UUID sessionId, UserPrincipal principal) {
        TestingSession session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TestingSession", sessionId));

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BadRequestException("Session is not in progress. Current status: " + session.getStatus());
        }

        boolean hasPending = testCaseRepository.existsBySessionIdAndResult(sessionId, TestResult.PENDING);
        if (hasPending) {
            throw new BadRequestException("Cannot complete session: there are still PENDING test cases. Please update all test cases before completing.");
        }

        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        session = sessionRepository.save(session);

        changeLogService.log(
                "TestingSession",
                session.getId().toString(),
                "COMPLETED",
                principal.getId(),
                "Testing session completed for stage " + session.getStage(),
                SessionStatus.IN_PROGRESS.name(),
                SessionStatus.COMPLETED.name()
        );

        List<TestCase> cases = testCaseRepository.findBySessionIdOrderByCategory(sessionId);
        return toDto(session, cases);
    }

    private TestingSessionDto toDto(TestingSession session, List<TestCase> cases) {
        List<TestCaseDto> caseDtos = cases.stream().map(tc -> new TestCaseDto(
                tc.getId(),
                session.getId(),
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
}
