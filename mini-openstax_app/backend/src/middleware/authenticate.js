// src/middleware/authenticate.js

import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT from Authorization header.
 * On success, sets `req.user = { userId, role, iat, ... }`
 * Assumes JWT was signed with `process.env.JWT_SECRET`
 */
export const authenticate = (req, res, next) => {
  // Extract token from "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1]; // Get token after "Bearer "

  try {
    // Verify token using secret
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure required fields exist
    if (!payload.userId || !payload.role) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Attach user context to request
    req.user = {
      userId: payload.userId,
      role: payload.role,
      iat: payload.iat,
      // Add other claims as needed (e.g., exp)
    };

    next(); // Proceed to next middleware/route
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token signature' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    // Fallback
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
