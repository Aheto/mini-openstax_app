// src/middleware/requireRole.js

/**
 * Middleware factory that restricts route access to specific user roles.
 * Usage in routes:
 *   app.use('/api/instructor', authenticate, requireRole('instructor'), analyticsRoutes);
 *
 * Assumes `req.user` has been populated by `authenticate` middleware with:
 *   { userId: string, role: 'student' | 'instructor', ... }
 *
 * @param {...string} allowedRoles - List of permitted roles (e.g., 'instructor')
 * @returns {Function} Express middleware
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should already be handled by `authenticate` middleware)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    // Role is valid — proceed
    next();
  };
};
