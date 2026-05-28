const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const STAGE_ROLE_MAP = {
  1: ['rd_head', 'admin'],
  2: ['operations', 'admin'],
  3: ['sales', 'admin'],
};

const STAGE_PASS_STATUS = { 1: 'stage1_passed', 2: 'stage2_passed', 3: 'approved' };
const STAGE_FAIL_STATUS = { 1: 'stage1_failed', 2: 'stage2_failed', 3: 'rejected' };
const NEXT_STAGE_STATUS = { 1: 'stage2_pending', 2: 'stage3_pending' };

function logChange(db, entityType, entityId, action, userId, details, oldVal, newVal) {
  db.prepare(`
    INSERT INTO change_log (id, entity_type, entity_id, action, changed_by, details, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), entityType, entityId, action, userId, details,
    oldVal ? JSON.stringify(oldVal) : null,
    newVal ? JSON.stringify(newVal) : null);
}

router.post('/sign', (req, res) => {
  const { firmware_id, session_id, stage, decision, comments } = req.body;
  if (!firmware_id || !session_id || !stage || !decision) {
    return res.status(400).json({ error: 'firmware_id, session_id, stage, decision required' });
  }

  const allowedRoles = STAGE_ROLE_MAP[stage];
  if (!allowedRoles || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: `Only ${allowedRoles?.join(' or ')} can sign off Stage ${stage}` });
  }

  const db = getDb();
  const session = db.prepare('SELECT * FROM testing_sessions WHERE id = ?').get(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'completed') return res.status(400).json({ error: 'Testing session must be completed before sign-off' });

  const fw = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(firmware_id);
  if (!fw) return res.status(404).json({ error: 'Firmware not found' });

  const existing = db.prepare('SELECT id FROM signoffs WHERE session_id = ?').get(session_id);
  if (existing) return res.status(400).json({ error: 'This session has already been signed off' });

  const signoffId = uuidv4();
  db.prepare(`
    INSERT INTO signoffs (id, firmware_id, stage, session_id, signed_by, decision, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(signoffId, firmware_id, stage, session_id, req.user.id, decision, comments || null);

  const newStatus = decision === 'approved' ? STAGE_PASS_STATUS[stage] : STAGE_FAIL_STATUS[stage];
  db.prepare(`UPDATE firmware_versions SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(newStatus, firmware_id);

  db.prepare(`UPDATE testing_sessions SET status = 'signed_off' WHERE id = ?`).run(session_id);

  if (decision === 'approved' && NEXT_STAGE_STATUS[stage]) {
    db.prepare(`UPDATE firmware_versions SET status = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(NEXT_STAGE_STATUS[stage], firmware_id);
  }

  const finalStatus = decision === 'approved'
    ? (NEXT_STAGE_STATUS[stage] || newStatus)
    : newStatus;

  logChange(db, 'signoff', signoffId, 'created', req.user.id,
    `Stage ${stage} ${decision} by ${req.user.name}. Firmware status: ${finalStatus}`,
    { firmware_status: fw.status },
    { firmware_status: finalStatus, decision, comments });

  res.status(201).json({
    message: `Stage ${stage} sign-off recorded. Firmware is now ${finalStatus}.`,
    signoff_id: signoffId,
    firmware_status: finalStatus,
  });
});

router.get('/firmware/:firmwareId', (req, res) => {
  const db = getDb();
  const signoffs = db.prepare(`
    SELECT s.*, u.name as signed_by_name, u.role as signed_by_role
    FROM signoffs s
    JOIN users u ON s.signed_by = u.id
    WHERE s.firmware_id = ?
    ORDER BY s.stage ASC
  `).all(req.params.firmwareId);
  res.json(signoffs);
});

module.exports = router;
