-- C:\Users\JNR\mini-openstax\backend\schema.sql

-- Enable UUID extension if needed (not used here, but common)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users: students and instructors
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcrypt hash
  role TEXT CHECK (role IN ('student', 'instructor')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books (e.g., "Algebra I")
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);

-- Chapters (e.g., "Linear Equations")
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL
);

-- Sections (optional subdivision of chapters)
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,
  position INTEGER NOT NULL  -- for ordering
);

-- Learning Objectives (LOs) - e.g., "ALG1-3.1.2"
CREATE TABLE learning_objectives (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  tag TEXT NOT NULL  -- e.g., "ALG1-3.1.2"
);

-- Assessment Items (MCQs)
CREATE TABLE assessment_items (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL
);

-- Options for each MCQ
CREATE TABLE assessment_item_options (
  id SERIAL PRIMARY KEY,
  assessment_item_id INTEGER NOT NULL REFERENCES assessment_items(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Junction table: link MCQs to LOs
CREATE TABLE assessment_item_objectives (
  assessment_item_id INTEGER NOT NULL REFERENCES assessment_items(id) ON DELETE CASCADE,
  learning_objective_id INTEGER NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  PRIMARY KEY (assessment_item_id, learning_objective_id)
);

-- Assignments: instructor assigns chapter to student
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions: student quiz results (raw JSON for replay)
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  chapter_id INTEGER NOT NULL REFERENCES chapters(id),
  score NUMERIC(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  answers_json JSONB NOT NULL,  -- [{"item_id":"1","option_id":"2"},...]
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: normalized submissions for scalable analytics
CREATE TABLE submission_items (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  assessment_item_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL
);

-- ✅ Required Indexes (per checklist)
CREATE INDEX ON users(email);
CREATE INDEX ON assignments(student_id);
CREATE INDEX ON assignments(instructor_id);
CREATE INDEX ON submissions(user_id);
CREATE INDEX ON submissions(chapter_id);
CREATE INDEX ON assessment_items(chapter_id);
CREATE INDEX ON learning_objectives(chapter_id);
CREATE INDEX ON sections(chapter_id);
CREATE INDEX ON submission_items(submission_id);
CREATE INDEX ON submission_items(assessment_item_id);
CREATE INDEX ON submission_items(is_correct);
