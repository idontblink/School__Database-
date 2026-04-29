const express = require('express');
const { body, validationResult, query } = require('express-validator');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

const validatePaper = [
  body('course_code').trim().notEmpty().withMessage('Course code is required'),
  body('course_name').trim().notEmpty().withMessage('Course name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
  body('exam_type').isIn(['Finals', 'Midsem', 'Quiz']).withMessage('Invalid exam type'),
  body('file_url').trim().notEmpty().withMessage('File URL is required'),
  body('tags').isArray().withMessage('Tags must be an array')
];

// Get all approved papers with filters
router.get('/', async (req, res) => {
  try {
    const { department, year, exam_type, search, tags, sort, page = 1, limit = 20 } = req.query;

    let query = 'SELECT p.*, u.username as uploader_name FROM papers p JOIN users u ON p.uploader_id = u.id WHERE p.status = $1';
    const params = ['approved'];
    let paramCount = 2;

    // Filters
    if (department) {
      query += ` AND p.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    if (year) {
      query += ` AND p.year = $${paramCount}`;
      params.push(parseInt(year));
      paramCount++;
    }

    if (exam_type) {
      query += ` AND p.exam_type = $${paramCount}`;
      params.push(exam_type);
      paramCount++;
    }

    if (search) {
      query += ` AND (p.course_code ILIKE $${paramCount} OR p.course_name ILIKE $${paramCount})`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
      paramCount += 2;
    }

    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',') : tags;
      // Simple tag filtering - checks if any tag matches
      const tagCondition = tagArray.map(() => `p.tags && $${paramCount++}`).join(' OR ');
      query += ` AND (${tagCondition})`;
      tagArray.forEach(tag => params.push([tag.trim()]));
    }

    // Sorting
    if (sort === 'upvotes') {
      query += ' ORDER BY p.upvotes DESC';
    } else if (sort === 'oldest') {
      query += ' ORDER BY p.year ASC, p.id ASC';
    } else {
      query += ' ORDER BY p.year DESC, p.id DESC'; // Default: most recent
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    // Count total
    const countQuery = query.substring(0, query.indexOf('ORDER BY'));
    const countResult = await pool.query(`SELECT COUNT(*) FROM (${countQuery}) as counted`, params.slice(0, paramCount - 2));

    const result = await pool.query(query, params);

    res.json({
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      papers: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single paper
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.username as uploader_name FROM papers p JOIN users u ON p.uploader_id = u.id WHERE p.id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload new paper
router.post('/', authenticateToken, validatePaper, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { course_code, course_name, department, year, exam_type, file_url, answer_file_url, tags } = req.body;

    const result = await pool.query(
      `INSERT INTO papers 
       (course_code, course_name, department, year, exam_type, file_url, answer_file_url, uploader_id, tags, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [course_code, course_name, department, year, exam_type, file_url, answer_file_url || null, req.user.id, tags || [], 'pending']
    );

    res.status(201).json({
      message: 'Paper uploaded successfully and pending admin approval',
      paper: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upvote a paper
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    // Check if already upvoted
    const existing = await pool.query(
      'SELECT id FROM upvotes WHERE user_id = $1 AND paper_id = $2',
      [req.user.id, req.params.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already upvoted this paper' });
    }

    // Add upvote
    await pool.query(
      'INSERT INTO upvotes (user_id, paper_id) VALUES ($1, $2)',
      [req.user.id, req.params.id]
    );

    // Increment upvote count
    const result = await pool.query(
      'UPDATE papers SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    res.json({ message: 'Upvoted successfully', paper: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Remove upvote
router.delete('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT id FROM upvotes WHERE user_id = $1 AND paper_id = $2',
      [req.user.id, req.params.id]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({ error: 'You have not upvoted this paper' });
    }

    await pool.query(
      'DELETE FROM upvotes WHERE user_id = $1 AND paper_id = $2',
      [req.user.id, req.params.id]
    );

    const result = await pool.query(
      'UPDATE papers SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    res.json({ message: 'Upvote removed', paper: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
