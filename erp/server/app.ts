import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { initDatabase } from './initDb';
import { syncEntityToTable } from './syncRelational';

export const app = express();

function safeJson(val: any): string {
  if (typeof val === 'string') {
    try {
      JSON.parse(val);
      return val;
    } catch {
      return JSON.stringify(val);
    }
  }
  return JSON.stringify(val);
}

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Lazy DB initialization for Serverless / Cloud environments
let dbInitPromise: Promise<void> | null = null;
export async function ensureDbInitialized() {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.error('Lazy DB initialization error:', err);
      dbInitPromise = null; // allow retry
      throw err;
    });
  }
  return dbInitPromise;
}

// Ensure DB is initialized before processing API data queries
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await ensureDbInitialized();
    } catch (e: any) {
      console.warn('DB initialization pending/failed on request:', e.message);
    }
  }
  next();
});

// Health Check with detailed PostgreSQL status and table stats
app.get('/api/health', async (req, res) => {
  try {
    await ensureDbInitialized();
    const result = await pool.query('SELECT current_database(), current_user, inet_server_port(), now()');
    
    // Quick row counts for verification
    const tables = ['items', 'jobs', 'clients', 'client_sites', 'vendors', 'boqs', 'tasks', 'purchases', 'stock_ledger', 'users'];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      try {
        const c = await pool.query(`SELECT count(*) FROM ${t}`);
        counts[t] = parseInt(c.rows[0].count, 10);
      } catch {
        counts[t] = 0;
      }
    }

    res.json({
      status: 'OK',
      postgres: 'connected',
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      port: result.rows[0].inet_server_port || 5432,
      timestamp: result.rows[0].now,
      counts,
      environment: process.env.VERCEL ? 'vercel-serverless' : 'local-node',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'ERROR',
      postgres: 'disconnected',
      message: err.message,
      hint: process.env.VERCEL
        ? 'Make sure DATABASE_URL is set in your Vercel Project Environment Variables to a cloud PostgreSQL database (e.g. Neon, Supabase, Render, AWS RDS).'
        : undefined,
    });
  }
});

// Fetch all keys from PostgreSQL
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, data FROM erp_entities');
    const allData: Record<string, any> = {};
    result.rows.forEach((row) => {
      allData[row.key] = row.data;
    });
    res.json(allData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch specific key from PostgreSQL
app.get('/api/data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT data FROM erp_entities WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Key not found' });
    }
    res.json(result.rows[0].data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Upsert key and sync to relational table
app.put('/api/data/:key', async (req, res) => {
  const client = await pool.connect();
  try {
    const { key } = req.params;
    const data = req.body;

    await client.query('BEGIN');
    // 1. Update JSON state
    await client.query(
      `INSERT INTO erp_entities (key, data, updated_at)
       VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET data = $2::jsonb, updated_at = CURRENT_TIMESTAMP`,
      [key, safeJson(data)]
    );

    // 2. Synchronize directly into relational table
    await syncEntityToTable(client, key, data);
    await client.query('COMMIT');

    res.json({ success: true, key });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Bulk sync all state to PostgreSQL
app.post('/api/sync-all', async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = req.body;
    await client.query('BEGIN');
    for (const [key, data] of Object.entries(payload)) {
      await client.query(
        `INSERT INTO erp_entities (key, data, updated_at)
         VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
         SET data = $2::jsonb, updated_at = CURRENT_TIMESTAMP`,
        [key, safeJson(data)]
      );
      await syncEntityToTable(client, key, data);
    }
    await client.query('COMMIT');
    res.json({ success: true, count: Object.keys(payload).length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Query relational tables directly
app.get('/api/tables/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const allowed = [
      'items', 'jobs', 'clients', 'client_sites', 'vendors', 'boqs', 'tasks',
      'purchases', 'stock_ledger', 'stock_movements', 'material_requests',
      'employees', 'attendance', 'expenses', 'petty_cash', 'invoices',
      'payments', 'users', 'roles', 'locations', 'cost_types', 'audit_logs', 'notifications'
    ];
    if (!allowed.includes(table)) {
      return res.status(400).json({ error: `Invalid table: ${table}` });
    }
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 500`);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Wipe & reset full database to completely clean state in PostgreSQL
app.post('/api/clear-all', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM erp_entities');
    const relationalTables = [
      'items', 'jobs', 'clients', 'client_sites', 'vendors', 'boqs', 'tasks',
      'purchases', 'stock_ledger', 'stock_movements', 'material_requests',
      'employees', 'attendance', 'expenses', 'petty_cash', 'invoices',
      'payments', 'users', 'roles', 'locations', 'cost_types', 'audit_logs', 'notifications'
    ];
    for (const t of relationalTables) {
      await client.query(`DELETE FROM ${t}`);
    }

    // Re-seed clean base user
    const adminUser = {
      id: 'usr-01',
      name: 'Admin User',
      email: 'admin@apex.in',
      role: 'Management / Admin',
      phone: '+91 98400 12345',
      status: 'Active',
      department: 'Management',
    };

    const emptyKeys: Record<string, any> = {
      apex_erp_current_user: adminUser,
      apex_erp_members: [adminUser],
      apex_erp_jobs: [],
      apex_erp_boqs: [],
      apex_erp_items: [],
      apex_erp_clients: [],
      apex_erp_client_sites: [],
      apex_erp_vendors: [],
      apex_erp_purchases: [],
      apex_erp_stock_ledger: [],
      apex_erp_stock_movements: [],
      apex_erp_locations: [
        {
          id: 'loc-01',
          name: 'Central Warehouse (Ambattur)',
          type: 'Warehouse',
          address: 'Industrial Estate, Ambattur, Chennai',
          responsiblePerson: 'Store Manager',
          contactPhone: '+91 98401 11223',
        },
      ],
      apex_erp_tasks: [],
      apex_erp_material_requests: [],
      apex_erp_employees: [],
      apex_erp_attendance: [],
      apex_erp_expenses: [],
      apex_erp_petty_cash: [],
      apex_erp_invoices: [],
      apex_erp_payments: [],
      apex_erp_cost_types: [
        { id: 'ct-1', name: 'Material', description: 'Wires, conduits, switchgear', isSystem: true },
        { id: 'ct-2', name: 'Labor', description: 'Electricians, helpers, wiremen', isSystem: true },
        { id: 'ct-3', name: 'Transportation', description: 'Freight, vehicle hire', isSystem: true },
        { id: 'ct-4', name: 'Equipment Hire', description: 'Scaffolding, crane, drill', isSystem: true },
        { id: 'ct-5', name: 'Consumables', description: 'Tapes, screws, raw plugs', isSystem: true },
      ],
      apex_erp_price_history: [],
      apex_erp_audit_logs: [],
      apex_erp_notifications: [],
    };

    for (const [k, v] of Object.entries(emptyKeys)) {
      await client.query(
        `INSERT INTO erp_entities (key, data, updated_at) VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)`,
        [k, safeJson(v)]
      );
      await syncEntityToTable(client, k, v);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'All mock data cleared from PostgreSQL!' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default app;

