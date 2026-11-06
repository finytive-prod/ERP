import { pool } from './db';
import { syncEntityToTable } from './syncRelational';

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

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Central JSONB collection table for ultra-fast full React state persistence
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_entities (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Relational tables for direct SQL reporting, joins, queries, and foreign tools
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
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS data JSONB`);
    await client.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        client_name TEXT,
        client_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        quoted_amount NUMERIC(15,2) DEFAULT 0,
        actual_spend NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS data JSONB`);
    await client.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE boqs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        gst_number TEXT,
        address TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT`);
    await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS data JSONB`);
    await client.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_sites (
        id VARCHAR(100) PRIMARY KEY,
        client_id VARCHAR(100),
        name TEXT NOT NULL,
        address TEXT,
        engineer_in_charge TEXT,
        supervisor TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        gst_number TEXT,
        categories JSONB,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email TEXT`);
    await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS data JSONB`);
    await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        job_id VARCHAR(100),
        site_id VARCHAR(100),
        title TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Planned',
        priority VARCHAR(50) DEFAULT 'Normal',
        start_date TEXT,
        due_date TEXT,
        progress NUMERIC(5,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(100) PRIMARY KEY,
        po_number VARCHAR(100),
        vendor_id VARCHAR(100),
        vendor_name TEXT,
        job_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Draft',
        total_amount NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_ledger (
        id VARCHAR(100) PRIMARY KEY,
        item_id VARCHAR(100),
        item_name TEXT,
        location_id VARCHAR(100),
        location_name TEXT,
        quantity NUMERIC(15,2) DEFAULT 0,
        standard_cost NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50),
        item_id VARCHAR(100),
        item_name TEXT,
        quantity NUMERIC(15,2) DEFAULT 0,
        from_location TEXT,
        to_location TEXT,
        job_id VARCHAR(100),
        date TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS material_requests (
        id VARCHAR(100) PRIMARY KEY,
        req_number VARCHAR(100),
        job_id VARCHAR(100),
        site_id VARCHAR(100),
        requested_by TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        date TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        phone TEXT,
        email TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        department TEXT,
        daily_rate NUMERIC(15,2) DEFAULT 0,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(100),
        employee_name TEXT,
        date TEXT,
        status VARCHAR(50) DEFAULT 'Present',
        job_id VARCHAR(100),
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        job_id VARCHAR(100),
        amount NUMERIC(15,2) DEFAULT 0,
        category TEXT,
        date TEXT,
        payment_mode VARCHAR(50) DEFAULT 'Cash',
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS petty_cash (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        balance NUMERIC(15,2) DEFAULT 0,
        custodian TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number VARCHAR(100),
        job_id VARCHAR(100),
        client_id VARCHAR(100),
        amount NUMERIC(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Draft',
        date TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(100) PRIMARY KEY,
        invoice_id VARCHAR(100),
        client_id VARCHAR(100),
        amount NUMERIC(15,2) DEFAULT 0,
        payment_mode VARCHAR(50) DEFAULT 'Bank Transfer',
        date TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT,
        phone TEXT,
        status VARCHAR(50) DEFAULT 'Active',
        department TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT '#3b82f6',
        is_system BOOLEAN DEFAULT false,
        permissions JSONB,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'Warehouse',
        address TEXT,
        responsible_person TEXT,
        contact_phone TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cost_types (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT false,
        date TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clean up old legacy keys (e.g. apex_jobs -> apex_erp_jobs)
    const oldKeysResult = await client.query(`SELECT key, data FROM erp_entities WHERE key NOT LIKE 'apex_erp_%'`);
    for (const row of oldKeysResult.rows) {
      const canonicalKey = row.key.replace(/^apex_/, 'apex_erp_');
      // If canonical key doesn't exist, migrate
      const existsCheck = await client.query(`SELECT 1 FROM erp_entities WHERE key = $1`, [canonicalKey]);
      if (existsCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO erp_entities (key, data, updated_at) VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)`,
          [canonicalKey, safeJson(row.data)]
        );
      }
      // Delete old legacy key
      await client.query(`DELETE FROM erp_entities WHERE key = $1`, [row.key]);
    }

    // Default seed user if none exists
    const adminUser = {
      id: 'usr-01',
      name: 'Admin User',
      email: 'admin@apex.in',
      role: 'Management / Admin',
      phone: '+91 98400 12345',
      status: 'Active',
      department: 'Management',
    };

    const cleanDefaultKeys: Record<string, any> = {
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
      apex_erp_audit_logs: [
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
      apex_erp_notifications: [],
    };

    for (const [key, val] of Object.entries(cleanDefaultKeys)) {
      await client.query(
        `INSERT INTO erp_entities (key, data, updated_at)
         VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO NOTHING`,
        [key, safeJson(val)]
      );
    }

    // Synchronize all existing records in erp_entities into the relational tables
    const allEntities = await client.query(`SELECT key, data FROM erp_entities`);
    for (const row of allEntities.rows) {
      await syncEntityToTable(client, row.key, row.data);
    }

    await client.query('COMMIT');
    console.log('✅ PostgreSQL apex_erp initialized successfully with all relational tables and synced data.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL tables:', err);
    throw err;
  } finally {
    client.release();
  }
}
