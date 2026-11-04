import { pool } from './db';

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Central JSONB collection table for high-performance React sync
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_entities (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Relational tables for direct SQL querying and reporting
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(100) PRIMARY KEY,
        sl_no INT,
        name TEXT NOT NULL,
        specification TEXT,
        category TEXT,
        unit VARCHAR(20),
        standard_cost NUMERIC(15,2) DEFAULT 0,
        min_stock NUMERIC(15,2) DEFAULT 0,
        current_stock NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        client_name TEXT,
        client_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        quoted_amount NUMERIC(15,2) DEFAULT 0,
        actual_spend NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS boqs (
        id VARCHAR(100) PRIMARY KEY,
        job_id VARCHAR(100),
        title TEXT,
        package_code VARCHAR(50),
        version_number INT DEFAULT 1,
        grand_total NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Draft',
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        gst_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        gst_number TEXT,
        categories JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        action VARCHAR(100),
        entity VARCHAR(100),
        entity_id VARCHAR(100),
        job_id VARCHAR(100),
        user_name VARCHAR(100),
        role VARCHAR(100),
        reason TEXT,
        old_value TEXT,
        new_value TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize clean user data if not present (no mock jobs/boqs/items per user request)
    const adminUser = [
      {
        id: 'usr-01',
        name: 'Admin User',
        email: 'admin@apex.in',
        role: 'Management / Admin',
        phone: '+91 98400 12345',
      },
    ];

    const cleanDefaultKeys: Record<string, any> = {
      apex_current_user: adminUser[0],
      apex_users: adminUser,
      apex_jobs: [],
      apex_boqs: [],
      apex_items: [],
      apex_clients: [],
      apex_vendors: [],
      apex_purchases: [],
      apex_stock_ledger: [],
      apex_stock_movements: [],
      apex_locations: [
        {
          id: 'loc-01',
          name: 'Central Warehouse (Ambattur)',
          type: 'Warehouse',
          address: 'Industrial Estate, Ambattur, Chennai',
          responsiblePerson: 'Store Manager',
          contactPhone: '+91 98401 11223',
        },
      ],
      apex_tasks: [],
      apex_material_requests: [],
      apex_employees: [],
      apex_attendance: [],
      apex_expenses: [],
      apex_petty_cash: [],
      apex_invoices: [],
      apex_payments: [],
      apex_cost_types: [
        { id: 'ct-1', name: 'Material', description: 'Wires, conduits, switchgear', isSystem: true },
        { id: 'ct-2', name: 'Labor', description: 'Electricians, helpers, wiremen', isSystem: true },
        { id: 'ct-3', name: 'Transportation', description: 'Freight, vehicle hire', isSystem: true },
        { id: 'ct-4', name: 'Equipment Hire', description: 'Scaffolding, crane, drill', isSystem: true },
        { id: 'ct-5', name: 'Consumables', description: 'Tapes, screws, raw plugs', isSystem: true },
      ],
      apex_price_history: [],
      apex_audit_logs: [
        {
          id: `aud-${Date.now()}`,
          userId: 'usr-01',
          userName: 'Admin User',
          role: 'Management / Admin',
          action: 'INIT_DATABASE',
          entity: 'System',
          entityId: 'apex_erp',
          reason: 'PostgreSQL database initialized with clean structure',
          timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        },
      ],
      apex_notifications: [],
    };

    for (const [key, val] of Object.entries(cleanDefaultKeys)) {
      await client.query(
        `INSERT INTO erp_entities (key, data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(val)]
      );
    }

    await client.query('COMMIT');
    console.log('PostgreSQL Database apex_erp initialized successfully with clean tables.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL tables:', err);
    throw err;
  } finally {
    client.release();
  }
}
