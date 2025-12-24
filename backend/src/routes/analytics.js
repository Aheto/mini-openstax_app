// src/routes/analytics.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /api/instructor/assignments/:id/analytics
 * Instructor-only analytics for a specific assignment.
 * Returns:
 * - completion rate
 * - average score
 * - count of students needing review (score < 80%)
 * - LO mastery breakdown
 */
router.get('/:id', async (req, res) => {
  const instructor_id = req.user?.userId;
  const role = req.user?.role;

  if (!instructor_id || role !== 'instructor') {
    return res.status(403).json({ error: 'Instructor access required' });
  }

  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid assignment ID' });
  }

  try {
    // 🔍 1. Verify assignment exists and belongs to this instructor
    const assignmentCheck = await pool.query(
      `SELECT a.id, c.title AS assignment_title
       FROM assignments a
       JOIN chapters c ON a.chapter_id = c.id
       WHERE a.id = $1 AND a.instructor_id = $2`,
      [id, instructor_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or access denied' });
    }

    const { assignment_title } = assignmentCheck.rows[0];

    // 📊 2. Fetch key metrics
    const metrics = await pool.query(
      `SELECT
         COUNT(DISTINCT a.student_id)::int AS total_students,
         COUNT(s.*)::float / NULLIF(COUNT(DISTINCT a.student_id), 0) AS completion_rate,
         COALESCE(AVG(s.score), 0)::float AS avg_score,
         COUNT(*) FILTER (WHERE s.score < 0.8)::int AS students_needing_review
       FROM assignments a
       LEFT JOIN submissions s ON a.student_id = s.user_id AND a.chapter_id = s.chapter_id
       WHERE a.id = $1`,
      [id]
    );

    const stats = metrics.rows[0];

    // 🎯 3. Fetch LO mastery (using submission_items for scalable aggregation)
    const loMastery = await pool.query(
      `SELECT
         lo.id,
         lo.tag,
         COALESCE(AVG(CAST(si.is_correct AS float)), 0)::float AS mastery
       FROM learning_objectives lo
       JOIN assessment_item_objectives aio ON lo.id = aio.learning_objective_id
       JOIN assessment_items ai ON aio.assessment_item_id = ai.id
       JOIN chapters c ON ai.chapter_id = c.id
       JOIN assignments a ON c.id = a.chapter_id
       LEFT JOIN submission_items si 
         ON ai.id = si.assessment_item_id
         AND si.submission_id IN (
           SELECT s.id FROM submissions s
           WHERE s.user_id = a.student_id AND s.chapter_id = c.id
         )
       WHERE a.id = $1
       GROUP BY lo.id, lo.tag`,
      [id]
    );

    // ✅ Assemble response
    const response = {
      assignment_title,
      total_students: stats.total_students || 0,
      completion_rate: parseFloat(stats.completion_rate) || 0,
      avg_score: parseFloat(stats.avg_score) || 0,
      students_needing_review: stats.students_needing_review || 0,
      lo_mastery: loMastery.rows.map(row => ({
        id: row.id,
        tag: row.tag,
        mastery: parseFloat(row.mastery)
      }))
    };

    res.json(response);

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
