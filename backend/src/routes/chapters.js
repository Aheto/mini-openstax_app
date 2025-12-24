// src/routes/chapters.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

/**
 * GET /api/chapters/:id
 * Returns a chapter with:
 * - HTML content
 * - Learning objectives (LOs)
 * - Embedded MCQs with options and LO mappings
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate input
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid chapter ID' });
  }

  try {
    // 🔹 1. Fetch chapter
    const chapterResult = await pool.query(
      `SELECT id, title, content_html 
       FROM chapters 
       WHERE id = $1`,
      [id]
    );

    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const chapter = chapterResult.rows[0];

    // 🔹 2. Fetch chapter-level learning objectives
    const loResult = await pool.query(
      `SELECT id, tag 
       FROM learning_objectives 
       WHERE chapter_id = $1`,
      [id]
    );
    chapter.learning_objectives = loResult.rows;

    // 🔹 3. Fetch assessment items (MCQs) for this chapter
    const itemsResult = await pool.query(
      `SELECT id, prompt 
       FROM assessment_items 
       WHERE chapter_id = $1 
       ORDER BY id`,
      [id]
    );

    const assessmentItems = [];
    for (const item of itemsResult.rows) {
      // 🔸 3a. Fetch options for this MCQ
      const optionsResult = await pool.query(
        `SELECT id, text, is_correct 
         FROM assessment_item_options 
         WHERE assessment_item_id = $1 
         ORDER BY id`,
        [item.id]
      );

      // 🔸 3b. Fetch LOs linked to this MCQ
      const itemLoResult = await pool.query(
        `SELECT lo.id, lo.tag
         FROM learning_objectives lo
         JOIN assessment_item_objectives aio 
           ON lo.id = aio.learning_objective_id
         WHERE aio.assessment_item_id = $1`,
        [item.id]
      );

      assessmentItems.push({
        id: item.id,
        prompt: item.prompt,
        options: optionsResult.rows,
        learning_objectives: itemLoResult.rows
      });
    }

    chapter.assessment_items = assessmentItems;

    // ✅ Send full nested structure
    res.json(chapter);

  } catch (err) {
    console.error('Chapter fetch error:', err);
    res.status(500).json({ error: 'Failed to load chapter' });
  }
});

export default router;
