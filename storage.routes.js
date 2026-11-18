const express = require('express');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const router = express.Router();
const db = new DatabaseSync('./chrono-storage.db');

router.post('/objects', (req, res) => {
  const {
    organization_id, user_id, bucket, path, filename,
    size_bytes, hash_sha256, mime_type, storage_node
  } = req.body;

  if (!organization_id || !bucket || !path || !filename || !hash_sha256 || !storage_node) {
    return res.status(400).json({ error: 'faltan campos requeridos' });
  }

  const file_id = crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT INTO storage_objects
      (file_id, organization_id, user_id, bucket, path, filename,
       size_bytes, hash_sha256, mime_type, storage_node)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    file_id, organization_id, user_id ?? null, bucket, path, filename,
    size_bytes ?? 0, hash_sha256, mime_type ?? null, storage_node
  );

  res.status(201).json({ file_id });
});

router.get('/objects', (req, res) => {
  const { organization_id } = req.query;
  if (!organization_id) {
    return res.status(400).json({ error: 'organization_id requerido' });
  }

  const rows = db.prepare(`
    SELECT * FROM storage_objects WHERE organization_id = ?
    ORDER BY created_at DESC
  `).all(organization_id);

  res.json(rows);
});

router.get('/objects/check-hash/:hash', (req, res) => {
  const row = db.prepare(`
    SELECT file_id, bucket, path FROM storage_objects
    WHERE hash_sha256 = ? LIMIT 1
  `).get(req.params.hash);

  res.json({ exists: !!row, existing: row ?? null });
});

module.exports = router;
