// src/routes/assignments.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /api/assignments
 * Student view: list all assigned chapters.
 * Requires: authenticated student
 */
router.get('/', async (req, res) => {
  const student_id = req.user?.userId;
  if (!student_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.chapter_id,
        c.title AS chapter_title,
        c.book_id,
        b.title AS book_title,
        a.assigned_at
      FROM assignments a
      JOIN chapters c ON a.chapter_id = c.id
      JOIN books b ON c.book_id = b.id
      WHERE a.student_id = $1
      ORDER BY a.assigned_at DESC
    `, [student_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

/**
 * POST /api/assignments
 * Instructor-only: assign a chapter to a student.
 * Body: { "chapter_id": "1", "student_id": "2" }
 */
router.post('/', async (req, res) => {
  const instructor_id = req.user?.userId;
  const role = req.user?.role;

  if (!instructor_id || role !== 'instructor') {
    return res.status(403).json({ error: 'Instructor access required' });
  }

  const { chapter_id, student_id } = req.body;

  // Validate input
  if (!chapter_id || !student_id) {
    return res.status(400).json({ error: 'Missing chapter_id or student_id' });
  }

  try {
    // 🔒 Verify chapter exists
    const chapterCheck = await pool.query(
      `SELECT id FROM chapters WHERE id = $1`,
      [chapter_id]
    );
    if (chapterCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid chapter_id' });
    }

    // 🔒 Verify student exists
    const studentCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'student'`,
      [student_id]
    );
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid student_id' });
    }

    // ✅ Create assignment
    const result = await pool.query(
      `INSERT INTO assignments (chapter_id, student_id, instructor_id, assigned_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, chapter_id, student_id, assigned_at`,
      [chapter_id, student_id, instructor_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Assignment creation error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

export default router;
