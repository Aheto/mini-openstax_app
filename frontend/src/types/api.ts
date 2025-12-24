// src/types/api.ts

// Learning Objective (LO) tag
export interface LearningObjective {
  id: string;
  tag: string; // e.g., "ALG1-3.1.2"
}

// Quiz option
export interface AssessmentOption {
  id: string;
  text: string;
  is_correct: boolean;
}

// MCQ item
export interface AssessmentItem {
  id: string;
  prompt: string;
  learning_objectives: LearningObjective[];
  options: AssessmentOption[];
}

// Chapter data (from GET /api/chapters/:id)
export interface ChapterData {
  id: string;
  title: string;
  content_html: string;
  learning_objectives: LearningObjective[];
  assessment_items: AssessmentItem[];
}

// Quiz submission answer
export interface SubmissionAnswer {
  item_id: string;
  option_id: string;
}

// Auto-grade result per item
export interface ItemResult {
  item_id: string;
  is_correct: boolean;
  correct_option_id?: string;
  correct_text?: string;
}

// Submission response (from POST /api/submissions)
export interface SubmissionResponse {
  score: number; // 0.0 to 1.0
  item_results: ItemResult[];
}

// Analytics per LO
export interface LOMastery {
  id: string;
  tag: string;
  mastery: number; // 0.0 to 1.0
}

// Instructor analytics (from GET /api/instructor/assignments/:id/analytics)
export interface AnalyticsData {
  assignment_title: string;
  total_students: number;
  completion_rate: number; // 0.0 to 1.0
  avg_score: number;       // 0.0 to 1.0
  students_needing_review: number;
  lo_mastery: LOMastery[];
}

// Assignment (from GET /api/assignments)
export interface Assignment {
  id: string;
  chapter_id: string;
  chapter_title: string;
  due_date?: string; // ISO 8601
  assigned_at: string;
}