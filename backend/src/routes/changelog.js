const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const db = getDb();
  const { entity_type, entity_id, limit = 100, offset = 0 } = req.query;

  let sql = `
    SELECT cl.*, u.name as changed_by_name
    FROM change_log cl
    JOIN users u ON cl.changed_by = u.id
  `;
  const params = [];
  const conditions = [];

  if (entity_type) { conditions.push('cl.entity_type = ?'); params.push(entity_type); }
  if (entity_id) { conditions.push('cl.entity_id = ?'); params.push(entity_id); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY cl.changed_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({
    ...r,
    old_value: r.old_value ? JSON.parse(r.old_value) : null,
    new_value: r.new_value ? JSON.parse(r.new_value) : null,
  })));
});

module.exports = router;
