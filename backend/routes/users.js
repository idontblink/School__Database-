const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, profile_name, department, level, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get stats
    const uploadsResult = await pool.query(
      'SELECT COUNT(*) FROM papers WHERE uploader_id = $1 AND status = $2',
      [req.params.id, 'approved']
    );

    const bookmarksResult = await pool.query(
      'SELECT COUNT(*) FROM bookmarks WHERE user_id = $1',
      [req.params.id]
    );

    const upvotesResult = await pool.query(
      `SELECT COUNT(*) FROM upvotes u 
       JOIN papers p ON u.paper_id = p.id 
       WHERE p.uploader_id = $1`,
      [req.params.id]
    );

    res.json({
      ...user,
      stats: {
        uploads: parseInt(uploadsResult.rows[0].count),
        bookmarks: parseInt(bookmarksResult.rows[0].count),
        upvotes: parseInt(upvotesResult.rows[0].count)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's uploaded papers
router.get('/:id/uploads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM papers p 
       WHERE p.uploader_id = $1 AND p.status = 'approved'
       ORDER BY p.created_at DESC`,
      [req.params.id]
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

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Only allow users to update their own profile
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { profile_name, department, level, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET profile_name = COALESCE($1, profile_name),
           department = COALESCE($2, department),
           level = COALESCE($3, level),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, username, email, profile_name, department, level, avatar_url`,
      [profile_name || null, department || null, level || null, avatar_url || null, req.params.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
