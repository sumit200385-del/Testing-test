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

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT fv.*, u.name as created_by_name
    FROM firmware_versions fv
    JOIN users u ON fv.created_by = u.id
    ORDER BY fv.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const fw = db.prepare(`
    SELECT fv.*, u.name as created_by_name
    FROM firmware_versions fv
    JOIN users u ON fv.created_by = u.id
    WHERE fv.id = ?
  `).get(req.params.id);
  if (!fw) return res.status(404).json({ error: 'Not found' });

  const sessions = db.prepare(`
    SELECT ts.*, u.name as tester_name
    FROM testing_sessions ts
    JOIN users u ON ts.tester_id = u.id
    WHERE ts.firmware_id = ?
    ORDER BY ts.started_at DESC
  `).all(req.params.id);

  const signoffs = db.prepare(`
    SELECT s.*, u.name as signed_by_name
    FROM signoffs s
    JOIN users u ON s.signed_by = u.id
    WHERE s.firmware_id = ?
    ORDER BY s.signed_at ASC
  `).all(req.params.id);

  res.json({ ...fw, sessions, signoffs });
});

router.post('/', (req, res) => {
  const { version, device_model, description, release_notes } = req.body;
  if (!version || !device_model) return res.status(400).json({ error: 'version and device_model required' });

  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO firmware_versions (id, version, device_model, platform, description, release_notes, created_by)
    VALUES (?, ?, ?, 'abckedn', ?, ?, ?)
  `).run(id, version, device_model, description || null, release_notes || null, req.user.id);

  logChange(db, 'firmware', id, 'created', req.user.id,
    `Firmware ${version} for ${device_model} created`, null,
    { version, device_model, description });

  const fw = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(id);
  res.status(201).json(fw);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const fw = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(req.params.id);
  if (!fw) return res.status(404).json({ error: 'Not found' });

  const { version, device_model, description, release_notes } = req.body;
  const oldData = { version: fw.version, device_model: fw.device_model, description: fw.description, release_notes: fw.release_notes };

  db.prepare(`
    UPDATE firmware_versions
    SET version = ?, device_model = ?, description = ?, release_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    version || fw.version,
    device_model || fw.device_model,
    description !== undefined ? description : fw.description,
    release_notes !== undefined ? release_notes : fw.release_notes,
    req.params.id
  );

  logChange(db, 'firmware', req.params.id, 'updated', req.user.id,
    `Firmware ${fw.version} updated`, oldData,
    { version, device_model, description, release_notes });

  res.json(db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(req.params.id));
});

router.post('/:id/submit', (req, res) => {
  const db = getDb();
  const fw = db.prepare('SELECT * FROM firmware_versions WHERE id = ?').get(req.params.id);
  if (!fw) return res.status(404).json({ error: 'Not found' });
  if (fw.status !== 'draft') return res.status(400).json({ error: 'Can only submit draft firmware' });

  db.prepare(`UPDATE firmware_versions SET status = 'stage1_pending', updated_at = datetime('now') WHERE id = ?`)
    .run(req.params.id);

  logChange(db, 'firmware', req.params.id, 'status_changed', req.user.id,
    'Submitted for Stage 1 Sanity Testing', { status: 'draft' }, { status: 'stage1_pending' });

  res.json({ message: 'Submitted for Stage 1 testing' });
});

module.exports = router;
