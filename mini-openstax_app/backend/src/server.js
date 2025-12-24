// backend/src/server.js
const staticPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(staticPath)); // ← Must point to build/

// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

// Routes
import chaptersRoutes from './routes/chapters.js';
import assignmentsRoutes from './routes/assignments.js';
import submissionsRoutes from './routes/submissions.js';
import analyticsRoutes from './routes/analytics.js';

// Middleware
import { authenticate } from './middleware/authenticate.js';
import { requireRole } from './middleware/requireRole.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow Vercel frontend + localhost dev
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Local React dev
    process.env.FRONTEND_URL || 'https://your-frontend.vercel.app' // Replace or set in Render
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads if needed

// 🔌 Public routes (no auth)
app.use('/api/chapters', chaptersRoutes);

// 🔐 Authenticated routes
// Student: view assignments + submit quizzes
app.use('/api/assignments', authenticate, assignmentsRoutes);
app.use('/api/submissions', authenticate, submissionsRoutes);

// Instructor: analytics + (assignment creation is in assignmentsRoutes with role check)
app.use('/api/instructor', authenticate, requireRole('instructor'), analyticsRoutes);

// 🩺 Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 📤 LTI Webhook (simulated grade passback)
app.post('/webhook/lti-grade', (req, res) => {
  // In MVP: just log and echo (real LTI would verify signature)
  console.log('📥 LTI Grade Received:', req.body);
  res.json({ 
    received: true, 
    grade: req.body.score,
    message: 'Grade recorded (simulated)' 
  });
});

// 🚨 Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 🏁 Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`📡 CORS allowed origins: ${corsOptions.origin.join(', ')}`);
});
