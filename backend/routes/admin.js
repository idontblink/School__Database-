const express = require('express');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get pending papers
router.get('/papers/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username as uploader_name FROM papers p 
       JOIN users u ON p.uploader_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`,
    );

    res.json({
      total: result.rows.length,
      papers: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Approve paper
router.post('/papers/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE papers 
       SET status = 'approved', approved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json({
      message: 'Paper approved successfully',
      paper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reject paper
router.post('/papers/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE papers 
       SET status = 'rejected', rejection_reason = $1
       WHERE id = $2
       RETURNING *`,
      [reason || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json({
      message: 'Paper rejected',
      paper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get statistics
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const papersCount = await pool.query('SELECT COUNT(*) FROM papers WHERE status = $1', ['approved']);
    const pendingCount = await pool.query('SELECT COUNT(*) FROM papers WHERE status = $1', ['pending']);
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const bookmarksCount = await pool.query('SELECT COUNT(*) FROM bookmarks');

    res.json({
      total_papers: parseInt(papersCount.rows[0].count),
      pending_papers: parseInt(pendingCount.rows[0].count),
      total_users: parseInt(usersCount.rows[0].count),
      total_bookmarks: parseInt(bookmarksCount.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
