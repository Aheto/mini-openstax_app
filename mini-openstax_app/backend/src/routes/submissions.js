// src/routes/submissions.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * POST /api/submissions
 * Student submits answers to a chapter quiz.
 * Request body:
 * {
 *   "chapter_id": "1",
 *   "answers": [
 *     { "item_id": "1", "option_id": "2" },
 *     { "item_id": "2", "option_id": "5" }
 *   ]
 * }
 */
router.post('/', async (req, res) => {
  const { chapter_id, answers } = req.body;
  
  // Authenticated user (from middleware in server.js)
  const student_id = req.user?.userId;
  if (!student_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate input
  if (!chapter_id || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Missing chapter_id or answers' });
  }

  try {
    // 🔒 Verify the student has an active assignment for this chapter
    const assignmentCheck = await pool.query(
      `SELECT id FROM assignments 
       WHERE student_id = $1 AND chapter_id = $2`,
      [student_id, chapter_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ 
        error: 'No active assignment found for this chapter' 
      });
    }

    // 🧠 Auto-grade each answer
    const itemResults = [];
    let correctCount = 0;

    for (const ans of answers) {
      if (!ans.item_id || !ans.option_id) {
        return res.status(400).json({ error: 'Invalid answer format' });
      }

      // Fetch the correct status of the selected option
      const optionResult = await pool.query(
        `SELECT is_correct 
         FROM assessment_item_options 
         WHERE id = $1 AND assessment_item_id = $2`,
        [ans.option_id, ans.item_id]
      );

      if (optionResult.rows.length === 0) {
        return res.status(400).json({ 
          error: `Invalid option_id ${ans.option_id} for item ${ans.item_id}` 
        });
      }

      const isCorrect = optionResult.rows[0].is_correct;
      itemResults.push({
        item_id: ans.item_id,
        is_correct: isCorrect
      });

      if (isCorrect) correctCount++;
    }

    const score = answers.length > 0 ? correctCount / answers.length : 0;

    // 💾 Store submission (raw JSON for replay)
    const submissionResult = await pool.query(
      `INSERT INTO submissions (user_id, chapter_id, score, answers_json)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [student_id, chapter_id, score, JSON.stringify(answers)]
    );

    const submissionId = submissionResult.rows[0].id;

    // 🔍 Optional: Store normalized data for scalable analytics
    // (Matches your checklist's "submission_items" table)
    for (const ans of answers) {
      const isCorrect = itemResults.find(r => r.item_id === ans.item_id).is_correct;
      await pool.query(
        `INSERT INTO submission_items (submission_id, assessment_item_id, option_id, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [submissionId, ans.item_id, ans.option_id, isCorrect]
      );
    }

    // ✅ Return auto-graded result
    res.status(201).json({
      score,
      item_results: itemResults
    });

  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

export default router;
