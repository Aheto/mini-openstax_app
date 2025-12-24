// C:\Users\JNR\mini-openstax\frontend\src\services\api.ts

import {
  ChapterData,
  SubmissionAnswer,
  SubmissionResponse,
  AnalyticsData,
  Assignment,
} from "../types/api";

// ✅ Use CRA-compatible env var (prefixed with REACT_APP_)
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

/**
 * Generic fetch wrapper with error handling
 */
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
};

// === Services ===

export const ChapterService = {
  getChapter: (id: string): Promise<ChapterData> =>
    apiFetch(`/api/chapters/${id}`),
};

export const SubmissionService = {
  submitQuiz: (
    chapter_id: string,
    answers: SubmissionAnswer[]
  ): Promise<SubmissionResponse> =>
    apiFetch("/api/submissions", {
      method: "POST",
      body: JSON.stringify({ chapter_id, answers }),
    }),
};

export const AnalyticsService = {
  getAssignmentAnalytics: (assignmentId: string): Promise<AnalyticsData> =>
    apiFetch(`/api/instructor/assignments/${assignmentId}/analytics`),
};

export const AssignmentService = {
  getAssignments: (): Promise<Assignment[]> => apiFetch("/api/assignments"),
  createAssignment: (data: {
    chapter_id: string;
    student_id: string;
  }): Promise<Assignment> =>
    apiFetch("/api/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const LTIWebhookService = {
  sendGrade: (payload: {
    user_id: string;
    line_item_id: string;
    score: number;
    timestamp: string;
  }): Promise<{ received: boolean; grade: number }> =>
    apiFetch("/webhook/lti-grade", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
