const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's bookmarks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM papers p 
       JOIN bookmarks b ON p.id = b.paper_id 
       WHERE b.user_id = $1 AND p.status = 'approved'
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({
      total: result.rows.length,
      bookmarks: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add bookmark
router.post('/:paperId', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.params;

    // Check if paper exists
    const paperCheck = await pool.query('SELECT id FROM papers WHERE id = $1', [paperId]);
    if (paperCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Check if already bookmarked
    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND paper_id = $2',
      [req.user.id, paperId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Paper already bookmarked' });
    }

    const result = await pool.query(
      'INSERT INTO bookmarks (user_id, paper_id) VALUES ($1, $2) RETURNING *',
      [req.user.id, paperId]
    );

    res.status(201).json({
      message: 'Paper bookmarked successfully',
      bookmark: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Remove bookmark
router.delete('/:paperId', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.params;

    const result = await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND paper_id = $2 RETURNING *',
      [req.user.id, paperId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
