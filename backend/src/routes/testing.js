const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function logChange(db, entityType, entityId, action, userId, details, oldVal, newVal) {
  db.prepare(`
    INSERT INTO change_log (id, entity_type, entity_id, action, changed_by, details, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), entityType, entityId, action, userId, details,
    oldVal ? JSON.stringify(oldVal) : null,
    newVal ? JSON.stringify(newVal) : null);
}

const STAGE1_TESTS = [
  { category: 'Device Connection', test_name: 'USB Serial/COM Port Connection', description: 'Connect VTD device via USB Serial/COM Port and verify detection', expected_value: 'Device detected on COM port' },
  { category: 'Device Connection', test_name: 'Power-up Verification', description: 'Verify device powers up correctly after connection', expected_value: 'Device powers up successfully' },
  { category: 'Device Connection', test_name: 'Baud Rate Configuration', description: 'Verify correct baud rate configuration for communication', expected_value: 'Communication established at correct baud rate' },
  { category: 'Device Connection', test_name: 'Packet Transmission Start', description: 'Verify device starts transmitting packets successfully', expected_value: 'Packets being received' },
  { category: 'Packet Validation', test_name: 'PVT Packet Verification', description: 'Verify PVT packet type is received per protocol', expected_value: 'PVT packets received' },
  { category: 'Packet Validation', test_name: 'Health Packet Verification', description: 'Verify Health packet type is received per protocol', expected_value: 'Health packets received' },
  { category: 'Packet Validation', test_name: 'Login Packet Verification', description: 'Verify Login packet type is received per protocol', expected_value: 'Login packet received' },
  { category: 'Packet Validation', test_name: 'Emergency Packet Verification', description: 'Verify Emergency packet type is received per protocol', expected_value: 'Emergency packet structure valid' },
  { category: 'Packet Validation', test_name: 'Packet Length Validation', description: 'Validate complete packet length against protocol standards', expected_value: 'All packets match expected length' },
  { category: 'Packet Validation', test_name: 'Header/Footer/Checksum Validation', description: 'Verify packet header, footer, and checksum/CRC compliance', expected_value: 'Header, footer, CRC all valid' },
  { category: 'CSV Data Validation', test_name: 'Field Count Validation', description: 'Validate CSV payload field count', expected_value: 'Correct field count' },
  { category: 'CSV Data Validation', test_name: 'Latitude/Longitude Range', description: 'Validate latitude (-90 to 90) and longitude (-180 to 180) ranges', expected_value: 'Lat/Lon within valid range' },
  { category: 'CSV Data Validation', test_name: 'Speed Value Validation', description: 'Validate speed value within acceptable limits', expected_value: 'Speed within valid range (0-300 km/h)' },
  { category: 'CSV Data Validation', test_name: 'Timestamp Format Validation', description: 'Validate timestamp format in CSV payload', expected_value: 'Timestamp format correct' },
  { category: 'CSV Data Validation', test_name: 'GSM/GPS Validity Flags', description: 'Verify GSM and GPS validity flag values', expected_value: 'Validity flags correct' },
  { category: 'Simulated Alert Testing', test_name: 'Ignition ON/OFF Alert', description: 'Simulate and verify ignition ON and OFF alert packets', expected_value: 'Alert packets generated on ignition state change' },
  { category: 'Simulated Alert Testing', test_name: 'Power Disconnect Alert', description: 'Simulate main power disconnect and verify alert', expected_value: 'Power disconnect alert generated' },
  { category: 'Simulated Alert Testing', test_name: 'Tamper Alert', description: 'Simulate tamper condition and verify alert packet', expected_value: 'Tamper alert packet generated' },
  { category: 'Simulated Alert Testing', test_name: 'Panic/SOS Alert', description: 'Trigger SOS and verify alert packet generation', expected_value: 'SOS alert packet generated and transmitted' },
  { category: 'Simulated Alert Testing', test_name: 'Over-speed Alert', description: 'Simulate over-speed condition and verify alert', expected_value: 'Over-speed alert generated at threshold' },
  { category: 'Simulated Alert Testing', test_name: 'Geo-fence Alert (Simulated)', description: 'Simulate geo-fence breach and verify alert', expected_value: 'Geo-fence entry/exit alert generated' },
  { category: 'Simulated Alert Testing', test_name: 'Low Battery Alert', description: 'Simulate low battery and verify alert packet', expected_value: 'Low battery alert generated' },
  { category: 'Packet Accuracy', test_name: 'Ignition ON Packet Frequency', description: 'Verify packet count matches configured reporting interval during Ignition ON', expected_value: 'Packet count matches expected frequency' },
  { category: 'Packet Accuracy', test_name: 'Ignition OFF Packet Frequency', description: 'Verify packet count during Ignition OFF state', expected_value: 'Reduced packet rate during Ignition OFF' },
  { category: 'Packet Accuracy', test_name: 'Missed Packet Analysis', description: 'Analyze frame sequence numbers for missing, duplicate, or delayed packets', expected_value: 'No missing or duplicate frames' },
  { category: 'Packet Accuracy', test_name: '24-Hour Stability Test', description: 'Monitor continuous packet transmission and communication stability over 24 hours', expected_value: '<1% packet loss over 24 hours' },
  { category: 'Configuration Testing', test_name: 'GPRS APN Setup', description: 'Validate APN configuration and connectivity', expected_value: 'Device connects via configured APN' },
  { category: 'Configuration Testing', test_name: 'Server IP/Port Configuration', description: 'Verify server IP and port configuration', expected_value: 'Device connects to correct server IP/port' },
  { category: 'Configuration Testing', test_name: 'SMS Command Handling', description: 'Verify device responds to SMS configuration commands', expected_value: 'SMS commands acknowledged and applied' },
  { category: 'FOTA Testing', test_name: 'Firmware Update Initiation', description: 'Initiate FOTA update and verify transfer starts', expected_value: 'FOTA update initiated successfully' },
  { category: 'FOTA Testing', test_name: 'Firmware Application & Reboot', description: 'Verify firmware is applied and device reboots correctly', expected_value: 'Firmware applied, device reboots' },
  { category: 'FOTA Testing', test_name: 'Post-FOTA Version Verification', description: 'Verify firmware version matches expected after FOTA', expected_value: 'Version matches target firmware version' },
  { category: 'FOTA Testing', test_name: 'IP Configuration Change Persistence', description: 'Change server IP/port and verify persistence after reboot', expected_value: 'Configuration persists across reboots' },
];

const STAGE2_TESTS = [
  { category: 'Vehicle Movement', test_name: 'Live Vehicle Tracking', description: 'Verify live vehicle tracking during actual road movement', expected_value: 'Continuous tracking during movement' },
  { category: 'Vehicle Movement', test_name: 'Route Accuracy Validation', description: 'Validate that route tracked matches actual vehicle path', expected_value: 'Route deviation < 50m' },
  { category: 'Vehicle Movement', test_name: 'GPS Lock Stability During Motion', description: 'Verify GPS lock is maintained during vehicle movement', expected_value: 'GPS lock maintained throughout trip' },
  { category: 'Vehicle Movement', test_name: 'Latitude/Longitude Update Frequency', description: 'Verify Lat/Lon updates at configured intervals during movement', expected_value: 'Updates per configured frequency' },
  { category: 'Driving Behavior', test_name: 'Harsh Braking Detection', description: 'Test harsh braking event detection during actual driving', expected_value: 'HB event captured and transmitted' },
  { category: 'Driving Behavior', test_name: 'Harsh Acceleration Detection', description: 'Test harsh acceleration event detection', expected_value: 'HA event captured and transmitted' },
  { category: 'Driving Behavior', test_name: 'Sharp Turn Detection', description: 'Validate sharp turn/cornering detection', expected_value: 'Sharp turn event detected correctly' },
  { category: 'Driving Behavior', test_name: 'Tilt/Rollover Detection', description: 'Verify tilt and rollover detection events', expected_value: 'Tilt/rollover alert generated' },
  { category: 'Driving Behavior', test_name: 'Over-speed Alert (Field)', description: 'Validate over-speed alert generation during field driving', expected_value: 'Over-speed alert at configured threshold' },
  { category: 'Ignition & Vehicle State', test_name: 'Ignition ON Detection (Field)', description: 'Verify actual vehicle ignition ON is detected correctly', expected_value: 'Ignition ON packet generated on engine start' },
  { category: 'Ignition & Vehicle State', test_name: 'Ignition OFF Detection (Field)', description: 'Verify actual vehicle ignition OFF is detected correctly', expected_value: 'Ignition OFF packet generated on engine stop' },
  { category: 'Ignition & Vehicle State', test_name: 'ACC Line Behavior', description: 'Validate ACC (Accessory) line behavior in different states', expected_value: 'ACC line state reflected correctly' },
  { category: 'Ignition & Vehicle State', test_name: 'Power Disconnect/Reconnect (Field)', description: 'Test power disconnect and reconnect under field conditions', expected_value: 'Device recovers, alert generated' },
  { category: 'Network & Communication', test_name: 'GPRS/4G Signal Fluctuation', description: 'Test device behavior during signal fluctuation in field', expected_value: 'Device handles fluctuation, no data loss' },
  { category: 'Network & Communication', test_name: 'Network Loss & Recovery', description: 'Verify packet buffering and resend on network loss', expected_value: 'Buffered packets resent after reconnection' },
  { category: 'Network & Communication', test_name: 'SIM Operator Switching', description: 'Validate behavior during SIM network switching', expected_value: 'Device reconnects on network switch' },
  { category: 'GPS Accuracy', test_name: 'Urban Area GPS Stability', description: 'Test GPS accuracy in dense urban areas', expected_value: 'GPS accuracy within 10m in urban areas' },
  { category: 'GPS Accuracy', test_name: 'Cold Start GPS Lock Time', description: 'Measure GPS cold start acquisition time', expected_value: 'Cold start lock < 60 seconds' },
  { category: 'GPS Accuracy', test_name: 'Hot Start GPS Lock Time', description: 'Measure GPS hot start acquisition time', expected_value: 'Hot start lock < 5 seconds' },
  { category: 'GPS Accuracy', test_name: 'Tunnel/Basement Behavior', description: 'Verify device behavior in GPS-denied areas', expected_value: 'Device buffers and resumes tracking after GPS recovery' },
  { category: 'Environmental', test_name: 'Day Operation Stability', description: 'Verify stable operation during daytime conditions', expected_value: 'Stable operation throughout day' },
  { category: 'Environmental', test_name: 'Night Operation Stability', description: 'Verify stable operation during night conditions', expected_value: 'Stable operation throughout night' },
  { category: 'Environmental', test_name: 'Long-Duration Runtime', description: 'Verify device stability over extended operation periods', expected_value: 'No unexpected reboots over 12+ hours' },
  { category: 'Real-Time Server', test_name: 'Live Server Packet Reception', description: 'Verify packets are received by server in real time', expected_value: 'Packets appear on server within 5 seconds' },
  { category: 'Real-Time Server', test_name: 'Dashboard Visibility', description: 'Validate device is visible and trackable on dashboard', expected_value: 'Vehicle visible and tracking on dashboard' },
  { category: 'Real-Time Server', test_name: 'Real-Time Alert Generation', description: 'Verify alerts appear in real time on server/dashboard', expected_value: 'Alerts visible within 10 seconds' },
  { category: 'Power & Battery', test_name: 'Internal Battery Backup Duration', description: 'Measure internal battery backup time after power disconnect', expected_value: 'Minimum 4 hours backup' },
  { category: 'Power & Battery', test_name: 'Vehicle Battery Fluctuation Handling', description: 'Test device during vehicle battery voltage fluctuations', expected_value: 'No resets during voltage fluctuations' },
  { category: 'Power & Battery', test_name: 'Sleep & Wake Behavior', description: 'Verify sleep mode activation and wake-up behavior', expected_value: 'Device enters sleep and wakes correctly' },
  { category: 'Long-Duration Observation', test_name: '24-Hour Field Monitoring', description: 'Monitor device over 24+ hours in field conditions', expected_value: '<0.5% packet loss, no unexpected reboots' },
  { category: 'Long-Duration Observation', test_name: 'Network Recovery Stability', description: 'Verify network recovery stability over extended period', expected_value: 'Consistent reconnection behavior' },
  { category: 'Geo-Fence & Alert (Field)', test_name: 'Geo-Fence Entry/Exit Alert', description: 'Validate geo-fence alerts during actual vehicle movement', expected_value: 'Alerts generated at fence boundaries' },
  { category: 'Geo-Fence & Alert (Field)', test_name: 'SOS/Panic Alert (Field)', description: 'Trigger and validate SOS alert in field', expected_value: 'SOS alert received within 5 seconds' },
  { category: 'Geo-Fence & Alert (Field)', test_name: 'Tamper Alert (Field)', description: 'Validate tamper alert under field conditions', expected_value: 'Tamper alert generated and received' },
];

const STAGE3_TESTS = [
  { category: 'Tracking Application Review', test_name: 'Dashboard Live Tracking', description: 'Sales team verifies vehicle is visible and tracking live on application', expected_value: 'Vehicle tracked live on dashboard' },
  { category: 'Tracking Application Review', test_name: 'Historical Route Playback', description: 'Verify historical route playback is accurate', expected_value: 'Route history matches actual vehicle path' },
  { category: 'Tracking Application Review', test_name: 'Alert & Notification Display', description: 'Verify all alerts appear correctly in the tracking application', expected_value: 'All alerts displayed correctly with details' },
  { category: 'Tracking Application Review', test_name: 'Report Generation', description: 'Verify device reports can be generated accurately', expected_value: 'Reports generate with correct data' },
  { category: 'Tracking Application Review', test_name: 'Multi-Device Tracking', description: 'Verify multiple devices are trackable simultaneously', expected_value: 'All devices visible and tracking' },
  { category: 'Field Testing Validation', test_name: 'Stage 2 Results Review', description: 'Sales team reviews field testing results from Operations', expected_value: 'All Stage 2 tests passed with acceptable results' },
  { category: 'Field Testing Validation', test_name: 'Customer Demo Readiness', description: 'Verify device and platform are ready for customer demonstration', expected_value: 'Platform demo-ready with full functionality' },
  { category: 'Field Testing Validation', test_name: 'Packet Loss Acceptance', description: 'Validate packet loss is within acceptable commercial limits', expected_value: 'Packet loss < 1% over 24 hours' },
  { category: 'Compliance Check', test_name: 'Protocol Compliance Verification', description: 'Final check that device meets protocol compliance standards', expected_value: 'Full protocol compliance confirmed' },
  { category: 'Compliance Check', test_name: 'Performance Benchmark', description: 'Confirm device meets all performance benchmarks for commercial deployment', expected_value: 'All benchmarks met or exceeded' },
];

function getTemplateForStage(stage) {
  if (stage === 1) return STAGE1_TESTS;
  if (stage === 2) return STAGE2_TESTS;
  return STAGE3_TESTS;
}

router.get('/firmware/:firmwareId', (req, res) => {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT ts.*, u.name as tester_name
    FROM testing_sessions ts
    JOIN users u ON ts.tester_id = u.id
    WHERE ts.firmware_id = ?
    ORDER BY ts.started_at DESC
  `).all(req.params.firmwareId);
  res.json(sessions);
});

router.post('/start', (req, res) => {
  const { firmware_id, stage, notes } = req.body;
  if (!firmware_id || !stage) return res.status(400).json({ error: 'firmware_id and stage required' });

  const db = getDb();
  const fw = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(firmware_id);
  if (!fw) return res.status(404).json({ error: 'Firmware not found' });

  const stageStatusMap = { 1: 'stage1_pending', 2: 'stage2_pending', 3: 'stage3_pending' };
  if (fw.status !== stageStatusMap[stage]) {
    return res.status(400).json({ error: `Firmware must be in ${stageStatusMap[stage]} status to start stage ${stage} testing` });
  }

  const existing = db.prepare(`
    SELECT id FROM testing_sessions WHERE firmware_id = ? AND stage = ? AND status = 'in_progress'
  `).get(firmware_id, stage);
  if (existing) return res.status(400).json({ error: 'A testing session for this stage is already in progress' });

  const sessionId = uuidv4();
  db.prepare(`
    INSERT INTO testing_sessions (id, firmware_id, stage, tester_id, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, firmware_id, stage, req.user.id, notes || null);

  const template = getTemplateForStage(stage);
  const insertCase = db.prepare(`
    INSERT INTO test_cases (id, session_id, category, test_name, description, expected_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const t of template) {
    insertCase.run(uuidv4(), sessionId, t.category, t.test_name, t.description, t.expected_value);
  }

  logChange(db, 'testing_session', sessionId, 'created', req.user.id,
    `Stage ${stage} testing session started for firmware ${fw.version}`, null,
    { firmware_id, stage, tester: req.user.name });

  const session = db.prepare('SELECT * FROM testing_sessions WHERE id = ?').get(sessionId);
  res.status(201).json(session);
});

router.get('/:sessionId', (req, res) => {
  const db = getDb();
  const session = db.prepare(`
    SELECT ts.*, u.name as tester_name, fv.version as firmware_version, fv.device_model
    FROM testing_sessions ts
    JOIN users u ON ts.tester_id = u.id
    JOIN firmware_versions fv ON ts.firmware_id = fv.id
    WHERE ts.id = ?
  `).get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const cases = db.prepare('SELECT * FROM test_cases WHERE session_id = ? ORDER BY category, test_name').all(req.params.sessionId);
  res.json({ ...session, test_cases: cases });
});

router.put('/:sessionId/case/:caseId', (req, res) => {
  const { result, actual_value, remarks } = req.body;
  const db = getDb();
  const tc = db.prepare('SELECT * FROM test_cases WHERE id = ? AND session_id = ?')
    .get(req.params.caseId, req.params.sessionId);
  if (!tc) return res.status(404).json({ error: 'Test case not found' });

  const old = { result: tc.result, actual_value: tc.actual_value, remarks: tc.remarks };
  db.prepare(`
    UPDATE test_cases SET result = ?, actual_value = ?, remarks = ?, tested_at = datetime('now')
    WHERE id = ?
  `).run(result || tc.result, actual_value || tc.actual_value, remarks || tc.remarks, req.params.caseId);

  logChange(db, 'test_case', req.params.caseId, 'updated', req.user.id,
    `Test case "${tc.test_name}" updated to ${result}`, old,
    { result, actual_value, remarks });

  res.json(db.prepare('SELECT * FROM test_cases WHERE id = ?').get(req.params.caseId));
});

router.post('/:sessionId/complete', (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT * FROM testing_sessions WHERE id = ?').get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'in_progress') return res.status(400).json({ error: 'Session is not in progress' });

  const pendingCases = db.prepare(`
    SELECT COUNT(*) as c FROM test_cases WHERE session_id = ? AND result = 'pending'
  `).get(req.params.sessionId);

  if (pendingCases.c > 0) {
    return res.status(400).json({ error: `${pendingCases.c} test cases still pending. Complete all tests before marking session complete.` });
  }

  db.prepare(`UPDATE testing_sessions SET status = 'completed', completed_at = datetime('now') WHERE id = ?`)
    .run(req.params.sessionId);

  logChange(db, 'testing_session', req.params.sessionId, 'completed', req.user.id,
    `Stage ${session.stage} testing session completed for firmware`, null, null);

  res.json({ message: 'Testing session marked as complete. Ready for sign-off.' });
});

module.exports = router;
