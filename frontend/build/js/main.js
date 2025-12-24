/**
 * Mini OpenStax MVP — Vanilla JavaScript App
 * Handles routing, API calls, and UI updates
 */

// ======================
// CONFIGURATION
// ======================

const API_BASE_URL = ''; // Same origin (no need for full URL in production)

// ======================
// UTILITIES
// ======================

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - Raw HTML string
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Show loading state in a container
 * @param {HTMLElement} container
 */
function showLoading(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
}

/**
 * Show error message in a container
 * @param {HTMLElement} container
 * @param {string} message
 */
function showError(container, message) {
  container.innerHTML = `<div class="error">${sanitizeHTML(message)}</div>`;
}

// ======================
// ROUTING
// ======================

/**
 * Get current route from URL path
 * @returns {Object} { path, params }
 */
function getCurrentRoute() {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);
  
  if (pathParts[0] === 'student' && pathParts[1] === 'chapter') {
    return { 
      view: 'student', 
      chapterId: pathParts[2] || '1',
      path 
    };
  }
  
  if (pathParts[0] === 'instructor' && pathParts[1] === 'analytics') {
    return { 
      view: 'instructor', 
      assignmentId: pathParts[2] || '1',
      path 
    };
  }
  
  if (path === '/lti/launch') {
    return { view: 'lti-launch' };
  }
  
  return { view: 'home', path };
}

/**
 * Navigate to a new route
 * @param {string} path
 */
function navigate(path) {
  window.history.pushState(null, '', path);
  renderApp();
}

// ======================
// API CLIENT
// ======================

const ApiClient = {
  /**
   * GET /api/chapters/:id
   * @param {string} id
   * @returns {Promise<Object>}
   */
  getChapter: (id) => {
    return fetch(`${API_BASE_URL}/api/chapters/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Chapter not found');
        return res.json();
      });
  },

  /**
   * POST /api/submissions
   * @param {string} chapter_id
   * @param {Array} answers
   * @returns {Promise<Object>}
   */
  submitQuiz: (chapter_id, answers) => {
    return fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_id, answers })
    }).then(res => {
      if (!res.ok) throw new Error('Submission failed');
      return res.json();
    });
  },

  /**
   * GET /api/instructor/assignments/:id/analytics
   * @param {string} id
   * @returns {Promise<Object>}
   */
  getAnalytics: (id) => {
    return fetch(`${API_BASE_URL}/api/instructor/assignments/${id}/analytics`)
      .then(res => {
        if (!res.ok) throw new Error('Analytics not available');
        return res.json();
      });
  }
};

// ======================
// VIEWS
// ======================

/**
 * Render homepage
 */
function renderHome() {
  const main = document.getElementById('main-content') || document.querySelector('main') || document.body;
  main.innerHTML = `
    <div class="homepage-logo">
      <div class="logo-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="logo-text">Mini OpenStax MVP</div>
    </div>

    <h1>Welcome to Mini OpenStax</h1>
    <p class="subtitle">An open educational platform for mastery-based learning with auto-graded assessments and real-time analytics.</p>

    <div class="roles-grid">
      <div class="role-card">
        <h2>Student</h2>
        <a href="/lti/launch?user_role=student&context_id=Algebra%20I" class="btn">Enter as Student</a>
      </div>
      <div class="role-card">
        <h2>Instructor</h2>
        <a href="/lti/launch?user_role=instructor&context_id=Algebra%20I" class="btn">Enter as Instructor</a>
      </div>
    </div>
  `;
}

/**
 * Render chapter for student
 * @param {Object} chapter
 */
function renderChapterView(chapter) {
  const main = document.getElementById('main-content') || document.querySelector('main') || document.body;
  
  // LO Tags
  const loTags = chapter.learning_objectives.map(lo => 
    `<span class="lo-tag">${sanitizeHTML(lo.tag)}</span>`
  ).join('');

  // Quiz Items
  const quizItems = chapter.assessment_items.map(item => {
    const options = item.options.map(opt => `
      <label class="quiz-option">
        <input type="radio" name="q-${item.id}" value="${opt.id}">
        ${sanitizeHTML(opt.text)}
      </label>
    `).join('');
    
    return `
      <div class="quiz-item" data-item-id="${item.id}">
        <p>${sanitizeHTML(item.prompt)}</p>
        ${options}
      </div>
    `;
  }).join('');

  const quizSection = chapter.assessment_items.length > 0 ? `
    <section class="card quiz-section">
      <h2>Check Your Understanding</h2>
      ${quizItems}
      <button class="btn" id="submit-quiz-btn" disabled>Submit Quiz</button>
    </section>
  ` : '';

  main.innerHTML = `
    <div class="header">
      <div>
        <h1>${sanitizeHTML(chapter.title)}</h1>
        <div class="lo-tags">${loTags}</div>
      </div>
      <div class="role-badge">Student View</div>
    </div>
    <article class="chapter-content">${chapter.content_html}</article>
    ${quizSection}
  `;

  // Setup quiz interactivity
  if (chapter.assessment_items.length > 0) {
    setupQuizListeners(chapter);
  }
}

/**
 * Set up quiz event listeners
 * @param {Object} chapter
 */
function setupQuizListeners(chapter) {
  const submitBtn = document.getElementById('submit-quiz-btn');
  const answers = {};

  // Handle option selection
  chapter.assessment_items.forEach(item => {
    const inputs = document.querySelectorAll(`input[name="q-${item.id}"]`);
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        answers[item.id] = e.target.value;
        updateSubmitButton(submitBtn, answers, chapter.assessment_items.length);
      });
    });
  });

  // Handle submission
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const answerArray = Object.entries(answers).map(([item_id, option_id]) => ({
        item_id,
        option_id
      }));

      try {
        showLoading(document.querySelector('main'));
        const result = await ApiClient.submitQuiz(chapter.id, answerArray);
        showQuizFeedback(chapter, result);
      } catch (err) {
        showError(document.querySelector('main'), err.message);
      }
    });
  }
}

/**
 * Update submit button state
 */
function updateSubmitButton(button, answers, totalItems) {
  if (button) {
    button.disabled = Object.keys(answers).length !== totalItems;
  }
}

/**
 * Show quiz results with feedback
 * @param {Object} chapter
 * @param {Object} result
 */
function showQuizFeedback(chapter, result) {
  const feedbackMap = {};
  result.item_results.forEach(r => {
    feedbackMap[r.item_id] = r;
  });

  let scoreHtml = `
    <div class="score-card">
      <p><strong>Your Score:</strong> ${Math.round(result.score * 100)}%</p>
      <button class="btn btn-secondary" disabled>Quiz Submitted</button>
    </div>
  `;

  // Re-render chapter with feedback
  const main = document.querySelector('main');
  const loTags = chapter.learning_objectives.map(lo => 
    `<span class="lo-tag">${sanitizeHTML(lo.tag)}</span>`
  ).join('');

  const quizItems = chapter.assessment_items.map(item => {
    const selectedOptionId = ''; // We don't track after submit
    const isCorrect = feedbackMap[item.id]?.is_correct;
    const correctOption = item.options.find(opt => opt.is_correct);
    
    const feedback = isCorrect ? 
      '<div class="quiz-feedback feedback-correct">✅ Correct!</div>' :
      `<div class="quiz-feedback feedback-incorrect">❌ Incorrect. The correct answer is: ${sanitizeHTML(correctOption?.text || '—')}</div>`;

    const options = item.options.map(opt => `
      <label class="quiz-option">
        <input type="radio" name="q-${item.id}" value="${opt.id}" disabled>
        ${sanitizeHTML(opt.text)}
        ${opt.is_correct ? ' <strong>(Correct)</strong>' : ''}
      </label>
    `).join('');
    
    return `
      <div class="quiz-item" data-item-id="${item.id}">
        <p>${sanitizeHTML(item.prompt)}</p>
        ${options}
        ${feedback}
      </div>
    `;
  }).join('');

  main.innerHTML = `
    <div class="header">
      <div>
        <h1>${sanitizeHTML(chapter.title)}</h1>
        <div class="lo-tags">${loTags}</div>
      </div>
      <div class="role-badge">Student View</div>
    </div>
    <article class="chapter-content">${chapter.content_html}</article>
    <section class="card quiz-section">
      <h2>Check Your Understanding</h2>
      ${quizItems}
      ${scoreHtml}
    </section>
  `;
}

/**
 * Render instructor analytics dashboard
 * @param {Object} data
 */
function renderAnalyticsView(data) {
  const main = document.getElementById('main-content') || document.querySelector('main') || document.body;

  // Metrics
  const metrics = `
    <div class="analytics-grid">
      <div class="metric-card">
        <div class="metric-value">${Math.round(data.completion_rate * 100)}%</div>
        <div class="metric-label">Completion Rate</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${Math.round(data.avg_score * 100)}%</div>
        <div class="metric-label">Average Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${data.students_needing_review}</div>
        <div class="metric-label">Needs Review</div>
      </div>
    </div>
  `;

  // LO Mastery
  const loMastery = data.lo_mastery.length > 0 ? `
    <section>
      <h2>Learning Objective Mastery</h2>
      ${data.lo_mastery.map(lo => {
        const isMastered = lo.mastery >= 0.8;
        return `
          <div class="card lo-mastery-item">
            <div class="lo-mastery-header">
              <strong class="lo-tag">${sanitizeHTML(lo.tag)}</strong>
              <span>${isMastered ? '✅ Mastered' : Math.round(lo.mastery * 100) + '% mastered'}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill ${isMastered ? 'mastered' : 'needs-review'}" 
                style="width: ${Math.min(100, lo.mastery * 100)}%">
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </section>
  ` : '<p>No learning objectives tracked for this assignment.</p>';

  main.innerHTML = `
    <div class="header">
      <div>
        <h1>${sanitizeHTML(data.assignment_title)}</h1>
        <p>${data.total_students} students enrolled</p>
      </div>
      <div class="role-badge">Instructor View</div>
    </div>
    ${metrics}
    ${loMastery}
  `;
}

// ======================
// APP CONTROLLER
// ======================

/**
 * Main render function based on route
 */
async function renderApp() {
  const route = getCurrentRoute();
  const main = document.getElementById('main-content') || document.querySelector('main') || document.body;

  try {
    switch (route.view) {
      case 'home':
        renderHome();
        break;
        
      case 'lti-launch':
        handleLtiLaunch();
        break;
        
      case 'student':
        showLoading(main);
        const chapter = await ApiClient.getChapter(route.chapterId);
        renderChapterView(chapter);
        break;
        
      case 'instructor':
        showLoading(main);
        const analytics = await ApiClient.getAnalytics(route.assignmentId);
        renderAnalyticsView(analytics);
        break;
        
      default:
        renderHome();
    }
  } catch (err) {
    showError(main, err.message);
  }
}

/**
 * Handle LTI launch simulation
 */
function handleLtiLaunch() {
  const urlParams = new URLSearchParams(window.location.search);
  const userRole = urlParams.get('user_role');
  const contextId = urlParams.get('context_id') || 'Default Course';

  if (userRole === 'student' || userRole === 'instructor') {
    // Save to localStorage
    localStorage.setItem('user_role', userRole);
    localStorage.setItem('context_id', contextId);
    
    // Redirect
    if (userRole === 'student') {
      navigate('/student/chapter/1');
    } else {
      navigate('/instructor/analytics/1');
    }
  } else {
    // Invalid role — go home
    navigate('/');
  }
}

// ======================
// INITIALIZE
// ======================

// Handle browser back/forward buttons
window.addEventListener('popstate', renderApp);

// Handle initial load
document.addEventListener('DOMContentLoaded', () => {
  // Auto-redirect if role is in localStorage
  const savedRole = localStorage.getItem('user_role');
  const pathname = window.location.pathname;
  
  if (savedRole === 'student' && pathname === '/') {
    navigate('/student/chapter/1');
    return;
  }
  if (savedRole === 'instructor' && pathname === '/') {
    navigate('/instructor/analytics/1');
    return;
  }
  
  renderApp();
});
