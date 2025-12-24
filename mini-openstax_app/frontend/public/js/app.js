/**
 * Mini OpenStax MVP — Shared JavaScript Utilities
 * For Vanilla HTML/CSS/JS frontend
 * Works with Express backend on Render
 */

// ======================
// CONFIGURATION
// ======================
const API_BASE_URL = ''; // Same origin in production

// ======================
// CORE UTILITIES
// ======================

/**
 * Sanitize string to prevent XSS
 * @param {string} input
 * @returns {string}
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Show loading state
 * @param {HTMLElement} el
 * @param {string} [msg='Loading...']
 */
export function showLoading(el, msg = 'Loading...') {
  if (el) el.innerHTML = `<div class="loading">${sanitizeHTML(msg)}</div>`;
}

/**
 * Show error message
 * @param {HTMLElement} el
 * @param {string} msg
 */
export function showError(el, msg) {
  if (el) {
    const safeMsg = sanitizeHTML(msg || 'An error occurred');
    el.innerHTML = `<div class="error">${safeMsg}</div>`;
  }
}

// ======================
// API CLIENT
// ======================

export const Api = {
  /**
   * GET /api/chapters/:id
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getChapter: (id) => {
    return fetch(`/api/chapters/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Chapter not found' : 'Failed to load chapter');
        return res.json();
      });
  },

  /**
   * POST /api/submissions
   * @param {string} chapter_id
   * @param {Array<{item_id: string, option_id: string}>} answers
   * @returns {Promise<Object>}
   */
  submitQuiz: (chapter_id, answers) => {
    return fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_id, answers })
    }).then(res => {
      if (!res.ok) {
        if (res.status === 403) throw new Error('Not assigned to this chapter');
        throw new Error('Submission failed');
      }
      return res.json();
    });
  },

  /**
   * GET /api/instructor/assignments/:id/analytics
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getAnalytics: (id) => {
    return fetch(`/api/instructor/assignments/${id}/analytics`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('Instructor access required');
          if (res.status === 404) throw new Error('Assignment not found');
          throw new Error('Failed to load analytics');
        }
        return res.json();
      });
  }
};

// ======================
// LTI SIMULATION & ROUTING
// ======================

/**
 * Handle simulated LTI launch
 */
export function handleLtiLaunch() {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('user_role');
  const context = params.get('context_id') || 'default';

  if (role === 'student' || role === 'instructor') {
    localStorage.setItem('user_role', role);
    localStorage.setItem('context_id', context);
    
    if (role === 'student') {
      window.location.href = '/student/chapter/1';
    } else {
      window.location.href = '/instructor/analytics/1';
    }
    return true;
  }
  return false;
}

// Auto-redirect on homepage if role saved
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/' || window.location.pathname === '/lti/launch') {
      if (!handleLtiLaunch()) {
        // Homepage: check for saved role
        if (window.location.pathname === '/') {
          const role = localStorage.getItem('user_role');
          if (role === 'student') window.location.href = '/student/chapter/1';
          if (role === 'instructor') window.location.href = '/instructor/analytics/1';
        }
      }
    }
  });
}
