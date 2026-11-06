import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/apex_erp';

// Detect if SSL is required (e.g. Neon, Supabase, Render, Railway, Vercel, AWS RDS, or explicit sslmode)
const requiresSsl =
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('render.com') ||
  connectionString.includes('railway.app') ||
  connectionString.includes('vercel-storage.com') ||
  connectionString.includes('rds.amazonaws.com') ||
  process.env.PGSSLMODE === 'require';

export const pool = new Pool({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  max: process.env.VERCEL ? 5 : 20, // keep pool lean on serverless lambdas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  // Connected to PostgreSQL DB
});

pool.on('error', (err) => {
  console.error('Unexpected error on PostgreSQL client:', err);
});
