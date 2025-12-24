// src/db.js

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env (for local development)
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Enable SSL only in production (Render requires it)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } // Render uses self-signed certs
    : false, // Allow local dev without SSL
});

// Optional: Log pool errors
pool.on('error', (err) => {
  console.error('🔥 PostgreSQL pool error:', err);
  process.exit(-1); // Critical: crash if DB connection dies
});

export default pool;
