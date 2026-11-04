import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { initDatabase } from './initDb';

const app = express();
const PORT = process.env.PORT || 5055;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), now()');
    res.json({
      status: 'OK',
      database: result.rows[0].current_database,
      timestamp: result.rows[0].now,
      postgres: 'connected',
    });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// Fetch all keys or a specific key
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

// Save / Upsert key
app.put('/api/data/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = req.body;
    await pool.query(
      `INSERT INTO erp_entities (key, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
       SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(data)]
    );
    res.json({ success: true, key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
         SET data = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(data)]
      );
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

// Wipe & reset full database to completely clean state
app.post('/api/clear-all', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM erp_entities');
    await client.query('DELETE FROM items');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM boqs');
    await client.query('DELETE FROM clients');
    await client.query('DELETE FROM vendors');
    await client.query('DELETE FROM audit_logs');

    // Re-seed clean base user
    const adminUser = {
      id: 'usr-01',
      name: 'Admin User',
      email: 'admin@apex.in',
      role: 'Management / Admin',
      phone: '+91 98400 12345',
    };

    const emptyKeys: Record<string, any> = {
      apex_current_user: adminUser,
      apex_users: [adminUser],
      apex_jobs: [],
      apex_boqs: [],
      apex_items: [],
      apex_clients: [],
      apex_vendors: [],
      apex_purchases: [],
      apex_stock_ledger: [],
      apex_stock_movements: [],
      apex_locations: [],
      apex_tasks: [],
      apex_material_requests: [],
      apex_employees: [],
      apex_attendance: [],
      apex_expenses: [],
      apex_petty_cash: [],
      apex_invoices: [],
      apex_payments: [],
      apex_cost_types: [],
      apex_price_history: [],
      apex_audit_logs: [],
      apex_notifications: [],
    };

    for (const [k, v] of Object.entries(emptyKeys)) {
      await client.query(
        `INSERT INTO erp_entities (key, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [k, JSON.stringify(v)]
      );
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

// Start Express server and initialize Postgres
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 PostgreSQL ERP API Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();
