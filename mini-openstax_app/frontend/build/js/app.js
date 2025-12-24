/**
 * Mini OpenStax MVP — Shared JavaScript Utilities
 * Reusable across all frontend pages
 */

// ======================
// CONFIGURATION
// ======================

const API_BASE_URL = ''; // Same origin (no need for full URL in production)

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - Raw string to sanitize
 * @returns {string} Safe HTML string
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format a score as a percentage
 * @param {number} score - Decimal score (0.0 to 1.0)
 * @returns {string} Formatted percentage
 */
export function formatScore(score) {
  if (typeof score !== 'number') return '0%';
  return Math.round(score * 100) + '%';
}

/**
 * Show loading state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Optional loading message
 */
export function showLoading(container, message = 'Loading...') {
  if (!container) return;
  container.innerHTML = `<div class="loading">${message}</div>`;
}

/**
 * Show error message in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 */
export function showError(container, message) {
  if (!container) return;
  const safeMessage = sanitizeHTML(message || 'An unknown error occurred');
  container.innerHTML = `<div class="error">${safeMessage}</div>`;
}

// ======================
// API CLIENT
// ======================

/**
 * API Client for Mini OpenStax Backend
 * All methods return promises
 */
export const ApiClient = {
  /**
   * Fetch a chapter by ID
   * @param {string|number} id - Chapter ID
   * @returns {Promise<Object>} Chapter data
   */
  getChapter: (id) => {
    return fetch(`${API_BASE_URL}/api/chapters/${id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Chapter not found');
          throw new Error(`Failed to load chapter (${res.status})`);
        }
        return res.json();
      });
  },

  /**
   * Submit quiz answers
   * @param {string|number} chapter_id - Chapter ID
   * @param {Array<{item_id: string, option_id: string}>} answers - Answer array
   * @returns {Promise<Object>} Submission result
   */
  submitQuiz: (chapter_id, answers) => {
    if (!Array.isArray(answers) || answers.length === 0) {
      return Promise.reject(new Error('No answers provided'));
    }

    return fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ chapter_id, answers })
    }).then(res => {
      if (!res.ok) {
        if (res.status === 403) throw new Error('You do not have an assignment for this chapter');
        if (res.status === 400) throw new Error('Invalid answers format');
        throw new Error(`Submission failed (${res.status})`);
      }
      return res.json();
    });
  },

  /**
   * Fetch assignment analytics
   * @param {string|number} assignmentId - Assignment ID
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: (assignmentId) => {
    return fetch(`${API_BASE_URL}/api/instructor/assignments/${assignmentId}/analytics`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('Access denied: Instructor role required');
          if (res.status === 404) throw new Error('Assignment not found');
          throw new Error(`Failed to load analytics (${res.status})`);
        }
        return res.json();
      });
  }
};

// ======================
// ROLE MANAGEMENT
// ======================

/**
 * Handle LTI launch simulation
 * Redirects based on URL parameters
 */
export function handleLtiLaunch() {
  const urlParams = new URLSearchParams(window.location.search);
  const userRole = urlParams.get('user_role');
  const contextId = urlParams.get('context_id') || 'Default Course';

  if (userRole === 'student' || userRole === 'instructor') {
    // Save to localStorage for persistence
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('context_id', contextId);
    
    // Redirect to role-specific route
    if (userRole === 'student') {
      window.location.href = '/student/chapter/1';
    } else {
      window.location.href = '/instructor/analytics/1';
    }
    return true;
  }
  return false;
}

/**
 * Check if user has a saved role
 * @returns {string|null} 'student', 'instructor', or null
 */
export function getSavedRole() {
  return localStorage.getItem('user_role');
}

// ======================
// DOM HELPERS
// ======================

/**
 * Create a DOM element with attributes and children
 * @param {string} tagName - HTML tag name
 * @param {Object} attributes - Attributes object
 * @param {Array|string} children - Child elements or text
 * @returns {HTMLElement}
 */
export function createElement(tagName, attributes = {}, children = []) {
  const el = document.createElement(tagName);
  
  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      el.className = value;
    } else if (key.startsWith('data-')) {
      el.dataset[key.substring(5)] = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  
  // Append children
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
  } else if (typeof children === 'string') {
    el.textContent = children;
  }
  
  return el;
}

// ======================
// AUTO-INIT FOR LTI LAUNCH PAGES
// ======================

// Auto-handle LTI launch on pages that need it
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run on LTI launch page or homepage
    if (window.location.pathname === '/lti/launch' || window.location.pathname === '/') {
      handleLtiLaunch();
      
      // Auto-redirect if role is saved (for homepage)
      if (window.location.pathname === '/') {
        const savedRole = getSavedRole();
        if (savedRole === 'student') {
          window.location.href = '/student/chapter/1';
        } else if (savedRole === 'instructor') {
          window.location.href = '/instructor/analytics/1';
        }
      }
    }
  });
}
