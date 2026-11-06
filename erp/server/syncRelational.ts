import { PoolClient } from 'pg';

export async function syncEntityToTable(client: PoolClient, key: string, data: any) {
  if (!data) return;

  try {
    switch (key) {
      case 'apex_erp_items': {
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO items (id, sl_no, name, specification, category, unit, standard_cost, min_stock, current_stock, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               sl_no = EXCLUDED.sl_no,
               name = EXCLUDED.name,
               specification = EXCLUDED.specification,
               category = EXCLUDED.category,
               unit = EXCLUDED.unit,
               standard_cost = EXCLUDED.standard_cost,
               min_stock = EXCLUDED.min_stock,
               current_stock = EXCLUDED.current_stock,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              item.id,
              item.slNo || null,
              item.name || '',
              item.specification || '',
              item.category || '',
              item.unit || '',
              item.standardCost || item.standard_cost || 0,
              item.minStock || item.min_stock || 0,
              item.currentStock || item.current_stock || 0,
              JSON.stringify(item),
            ]
          );
        }
        if (items.length > 0) {
          const ids = items.map((i) => i.id).filter(Boolean);
          await client.query(`DELETE FROM items WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM items');
        }
        break;
      }

      case 'apex_erp_jobs': {
        const jobs = Array.isArray(data) ? data : [data];
        for (const job of jobs) {
          if (!job.id) continue;
          await client.query(
            `INSERT INTO jobs (id, title, client_name, client_id, status, quoted_amount, actual_spend, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               client_name = EXCLUDED.client_name,
               client_id = EXCLUDED.client_id,
               status = EXCLUDED.status,
               quoted_amount = EXCLUDED.quoted_amount,
               actual_spend = EXCLUDED.actual_spend,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              job.id,
              job.title || '',
              job.clientName || job.client_name || '',
              job.clientId || job.client_id || '',
              job.status || 'Draft',
              job.quotedAmount || job.quoted_amount || 0,
              job.actualSpend || job.actual_spend || 0,
              JSON.stringify(job),
            ]
          );
        }
        if (jobs.length > 0) {
          const ids = jobs.map((j) => j.id).filter(Boolean);
          await client.query(`DELETE FROM jobs WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM jobs');
        }
        break;
      }

      case 'apex_erp_clients': {
        const clients = Array.isArray(data) ? data : [data];
        for (const c of clients) {
          if (!c.id) continue;
          await client.query(
            `INSERT INTO clients (id, name, contact_person, email, phone, gst_number, address, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               contact_person = EXCLUDED.contact_person,
               email = EXCLUDED.email,
               phone = EXCLUDED.phone,
               gst_number = EXCLUDED.gst_number,
               address = EXCLUDED.address,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              c.id,
              c.name || '',
              c.contactPerson || c.contact_person || '',
              c.email || '',
              c.phone || '',
              c.gstNumber || c.gst_number || '',
              c.address || '',
              JSON.stringify(c),
            ]
          );
        }
        if (clients.length > 0) {
          const ids = clients.map((c) => c.id).filter(Boolean);
          await client.query(`DELETE FROM clients WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM clients');
        }
        break;
      }

      case 'apex_erp_client_sites': {
        const sites = Array.isArray(data) ? data : [data];
        for (const s of sites) {
          if (!s.id) continue;
          await client.query(
            `INSERT INTO client_sites (id, client_id, name, address, engineer_in_charge, supervisor, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               client_id = EXCLUDED.client_id,
               name = EXCLUDED.name,
               address = EXCLUDED.address,
               engineer_in_charge = EXCLUDED.engineer_in_charge,
               supervisor = EXCLUDED.supervisor,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              s.id,
              s.clientId || s.client_id || '',
              s.name || '',
              s.address || '',
              s.engineerInCharge || s.engineer_in_charge || '',
              s.supervisor || '',
              JSON.stringify(s),
            ]
          );
        }
        if (sites.length > 0) {
          const ids = sites.map((s) => s.id).filter(Boolean);
          await client.query(`DELETE FROM client_sites WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM client_sites');
        }
        break;
      }

      case 'apex_erp_vendors': {
        const vendors = Array.isArray(data) ? data : [data];
        for (const v of vendors) {
          if (!v.id) continue;
          await client.query(
            `INSERT INTO vendors (id, name, contact_person, phone, email, gst_number, categories, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               contact_person = EXCLUDED.contact_person,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               gst_number = EXCLUDED.gst_number,
               categories = EXCLUDED.categories,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              v.id,
              v.name || '',
              v.contactPerson || v.contact_person || '',
              v.phone || '',
              v.email || '',
              v.gstNumber || v.gst_number || '',
              JSON.stringify(v.categories || []),
              JSON.stringify(v),
            ]
          );
        }
        if (vendors.length > 0) {
          const ids = vendors.map((v) => v.id).filter(Boolean);
          await client.query(`DELETE FROM vendors WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM vendors');
        }
        break;
      }

      case 'apex_erp_boqs': {
        const boqs = Array.isArray(data) ? data : [data];
        for (const b of boqs) {
          if (!b.id) continue;
          await client.query(
            `INSERT INTO boqs (id, job_id, title, package_code, version_number, grand_total, status, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               job_id = EXCLUDED.job_id,
               title = EXCLUDED.title,
               package_code = EXCLUDED.package_code,
               version_number = EXCLUDED.version_number,
               grand_total = EXCLUDED.grand_total,
               status = EXCLUDED.status,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              b.id,
              b.jobId || b.job_id || '',
              b.title || '',
              b.packageCode || b.package_code || '',
              b.versionNumber || b.version_number || 1,
              b.grandTotal || b.grand_total || 0,
              b.status || 'Draft',
              JSON.stringify(b),
            ]
          );
        }
        if (boqs.length > 0) {
          const ids = boqs.map((b) => b.id).filter(Boolean);
          await client.query(`DELETE FROM boqs WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM boqs');
        }
        break;
      }

      case 'apex_erp_tasks': {
        const tasks = Array.isArray(data) ? data : [data];
        for (const t of tasks) {
          if (!t.id) continue;
          await client.query(
            `INSERT INTO tasks (id, job_id, site_id, title, status, priority, start_date, due_date, progress, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               job_id = EXCLUDED.job_id,
               site_id = EXCLUDED.site_id,
               title = EXCLUDED.title,
               status = EXCLUDED.status,
               priority = EXCLUDED.priority,
               start_date = EXCLUDED.start_date,
               due_date = EXCLUDED.due_date,
               progress = EXCLUDED.progress,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              t.id,
              t.jobId || t.job_id || '',
              t.siteId || t.site_id || '',
              t.title || '',
              t.status || 'Planned',
              t.priority || 'Normal',
              t.startDate || t.start_date || null,
              t.dueDate || t.due_date || null,
              t.progress || 0,
              JSON.stringify(t),
            ]
          );
        }
        if (tasks.length > 0) {
          const ids = tasks.map((t) => t.id).filter(Boolean);
          await client.query(`DELETE FROM tasks WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM tasks');
        }
        break;
      }

      case 'apex_erp_purchases': {
        const purchases = Array.isArray(data) ? data : [data];
        for (const p of purchases) {
          if (!p.id) continue;
          await client.query(
            `INSERT INTO purchases (id, po_number, vendor_id, vendor_name, job_id, status, total_amount, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               po_number = EXCLUDED.po_number,
               vendor_id = EXCLUDED.vendor_id,
               vendor_name = EXCLUDED.vendor_name,
               job_id = EXCLUDED.job_id,
               status = EXCLUDED.status,
               total_amount = EXCLUDED.total_amount,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              p.id,
              p.poNumber || p.po_number || '',
              p.vendorId || p.vendor_id || '',
              p.vendorName || p.vendor_name || '',
              p.jobId || p.job_id || '',
              p.status || 'Draft',
              p.totalAmount || p.total_amount || 0,
              JSON.stringify(p),
            ]
          );
        }
        if (purchases.length > 0) {
          const ids = purchases.map((p) => p.id).filter(Boolean);
          await client.query(`DELETE FROM purchases WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM purchases');
        }
        break;
      }

      case 'apex_erp_stock_ledger': {
        const rows = Array.isArray(data) ? data : [data];
        for (const r of rows) {
          if (!r.id) continue;
          await client.query(
            `INSERT INTO stock_ledger (id, item_id, item_name, location_id, location_name, quantity, standard_cost, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               item_id = EXCLUDED.item_id,
               item_name = EXCLUDED.item_name,
               location_id = EXCLUDED.location_id,
               location_name = EXCLUDED.location_name,
               quantity = EXCLUDED.quantity,
               standard_cost = EXCLUDED.standard_cost,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              r.id,
              r.itemId || r.item_id || '',
              r.itemName || r.item_name || '',
              r.locationId || r.location_id || '',
              r.locationName || r.location_name || '',
              r.quantity || 0,
              r.standardCost || r.standard_cost || 0,
              JSON.stringify(r),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((r) => r.id).filter(Boolean);
          await client.query(`DELETE FROM stock_ledger WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM stock_ledger');
        }
        break;
      }

      case 'apex_erp_stock_movements': {
        const rows = Array.isArray(data) ? data : [data];
        for (const r of rows) {
          if (!r.id) continue;
          await client.query(
            `INSERT INTO stock_movements (id, type, item_id, item_name, quantity, from_location, to_location, job_id, date, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               type = EXCLUDED.type,
               item_id = EXCLUDED.item_id,
               item_name = EXCLUDED.item_name,
               quantity = EXCLUDED.quantity,
               from_location = EXCLUDED.from_location,
               to_location = EXCLUDED.to_location,
               job_id = EXCLUDED.job_id,
               date = EXCLUDED.date,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              r.id,
              r.type || '',
              r.itemId || r.item_id || '',
              r.itemName || r.item_name || '',
              r.quantity || 0,
              r.fromLocation || r.from_location || '',
              r.toLocation || r.to_location || '',
              r.jobId || r.job_id || '',
              r.date || '',
              JSON.stringify(r),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((r) => r.id).filter(Boolean);
          await client.query(`DELETE FROM stock_movements WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM stock_movements');
        }
        break;
      }

      case 'apex_erp_material_requests': {
        const rows = Array.isArray(data) ? data : [data];
        for (const r of rows) {
          if (!r.id) continue;
          await client.query(
            `INSERT INTO material_requests (id, req_number, job_id, site_id, requested_by, status, date, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               req_number = EXCLUDED.req_number,
               job_id = EXCLUDED.job_id,
               site_id = EXCLUDED.site_id,
               requested_by = EXCLUDED.requested_by,
               status = EXCLUDED.status,
               date = EXCLUDED.date,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              r.id,
              r.reqNumber || r.req_number || '',
              r.jobId || r.job_id || '',
              r.siteId || r.site_id || '',
              r.requestedBy || r.requested_by || '',
              r.status || 'Pending',
              r.date || '',
              JSON.stringify(r),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((r) => r.id).filter(Boolean);
          await client.query(`DELETE FROM material_requests WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM material_requests');
        }
        break;
      }

      case 'apex_erp_employees': {
        const employees = Array.isArray(data) ? data : [data];
        for (const e of employees) {
          if (!e.id) continue;
          await client.query(
            `INSERT INTO employees (id, name, role, phone, email, status, department, daily_rate, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               role = EXCLUDED.role,
               phone = EXCLUDED.phone,
               email = EXCLUDED.email,
               status = EXCLUDED.status,
               department = EXCLUDED.department,
               daily_rate = EXCLUDED.daily_rate,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              e.id,
              e.name || '',
              e.role || '',
              e.phone || '',
              e.email || '',
              e.status || 'Active',
              e.department || '',
              e.dailyRate || e.daily_rate || 0,
              JSON.stringify(e),
            ]
          );
        }
        if (employees.length > 0) {
          const ids = employees.map((e) => e.id).filter(Boolean);
          await client.query(`DELETE FROM employees WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM employees');
        }
        break;
      }

      case 'apex_erp_attendance': {
        const rows = Array.isArray(data) ? data : [data];
        for (const a of rows) {
          if (!a.id) continue;
          await client.query(
            `INSERT INTO attendance (id, employee_id, employee_name, date, status, job_id, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               employee_id = EXCLUDED.employee_id,
               employee_name = EXCLUDED.employee_name,
               date = EXCLUDED.date,
               status = EXCLUDED.status,
               job_id = EXCLUDED.job_id,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              a.id,
              a.employeeId || a.employee_id || '',
              a.employeeName || a.employee_name || '',
              a.date || '',
              a.status || 'Present',
              a.jobId || a.job_id || '',
              JSON.stringify(a),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((a) => a.id).filter(Boolean);
          await client.query(`DELETE FROM attendance WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM attendance');
        }
        break;
      }

      case 'apex_erp_expenses': {
        const rows = Array.isArray(data) ? data : [data];
        for (const e of rows) {
          if (!e.id) continue;
          await client.query(
            `INSERT INTO expenses (id, title, job_id, amount, category, date, payment_mode, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               job_id = EXCLUDED.job_id,
               amount = EXCLUDED.amount,
               category = EXCLUDED.category,
               date = EXCLUDED.date,
               payment_mode = EXCLUDED.payment_mode,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              e.id,
              e.title || '',
              e.jobId || e.job_id || '',
              e.amount || 0,
              e.category || '',
              e.date || '',
              e.paymentMode || e.payment_mode || 'Cash',
              JSON.stringify(e),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((e) => e.id).filter(Boolean);
          await client.query(`DELETE FROM expenses WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM expenses');
        }
        break;
      }

      case 'apex_erp_petty_cash': {
        const rows = Array.isArray(data) ? data : [data];
        for (const p of rows) {
          if (!p.id) continue;
          await client.query(
            `INSERT INTO petty_cash (id, name, balance, custodian, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               balance = EXCLUDED.balance,
               custodian = EXCLUDED.custodian,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              p.id,
              p.name || '',
              p.balance || 0,
              p.custodian || '',
              JSON.stringify(p),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((p) => p.id).filter(Boolean);
          await client.query(`DELETE FROM petty_cash WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM petty_cash');
        }
        break;
      }

      case 'apex_erp_invoices': {
        const rows = Array.isArray(data) ? data : [data];
        for (const inv of rows) {
          if (!inv.id) continue;
          await client.query(
            `INSERT INTO invoices (id, invoice_number, job_id, client_id, amount, status, date, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               invoice_number = EXCLUDED.invoice_number,
               job_id = EXCLUDED.job_id,
               client_id = EXCLUDED.client_id,
               amount = EXCLUDED.amount,
               status = EXCLUDED.status,
               date = EXCLUDED.date,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              inv.id,
              inv.invoiceNumber || inv.invoice_number || '',
              inv.jobId || inv.job_id || '',
              inv.clientId || inv.client_id || '',
              inv.amount || 0,
              inv.status || 'Draft',
              inv.date || '',
              JSON.stringify(inv),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((i) => i.id).filter(Boolean);
          await client.query(`DELETE FROM invoices WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM invoices');
        }
        break;
      }

      case 'apex_erp_payments': {
        const rows = Array.isArray(data) ? data : [data];
        for (const p of rows) {
          if (!p.id) continue;
          await client.query(
            `INSERT INTO payments (id, invoice_id, client_id, amount, payment_mode, date, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               invoice_id = EXCLUDED.invoice_id,
               client_id = EXCLUDED.client_id,
               amount = EXCLUDED.amount,
               payment_mode = EXCLUDED.payment_mode,
               date = EXCLUDED.date,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              p.id,
              p.invoiceId || p.invoice_id || '',
              p.clientId || p.client_id || '',
              p.amount || 0,
              p.paymentMode || p.payment_mode || 'Bank Transfer',
              p.date || '',
              JSON.stringify(p),
            ]
          );
        }
        if (rows.length > 0) {
          const ids = rows.map((p) => p.id).filter(Boolean);
          await client.query(`DELETE FROM payments WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM payments');
        }
        break;
      }

      case 'apex_erp_members': {
        const members = Array.isArray(data) ? data : [data];
        for (const m of members) {
          if (!m.id) continue;
          await client.query(
            `INSERT INTO users (id, name, email, role, phone, status, department, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               email = EXCLUDED.email,
               role = EXCLUDED.role,
               phone = EXCLUDED.phone,
               status = EXCLUDED.status,
               department = EXCLUDED.department,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              m.id,
              m.name || '',
              m.email || '',
              m.role || '',
              m.phone || '',
              m.status || 'Active',
              m.department || '',
              JSON.stringify(m),
            ]
          );
        }
        if (members.length > 0) {
          const ids = members.map((m) => m.id).filter(Boolean);
          await client.query(`DELETE FROM users WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM users');
        }
        break;
      }

      case 'apex_erp_roles': {
        const roles = Array.isArray(data) ? data : [data];
        for (const r of roles) {
          if (!r.id) continue;
          await client.query(
            `INSERT INTO roles (id, name, description, color, is_system, permissions, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               color = EXCLUDED.color,
               is_system = EXCLUDED.is_system,
               permissions = EXCLUDED.permissions,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              r.id,
              r.name || '',
              r.description || '',
              r.color || '#3b82f6',
              r.isSystem || false,
              JSON.stringify(r.permissions || []),
              JSON.stringify(r),
            ]
          );
        }
        if (roles.length > 0) {
          const ids = roles.map((r) => r.id).filter(Boolean);
          await client.query(`DELETE FROM roles WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM roles');
        }
        break;
      }

      case 'apex_erp_locations': {
        const locations = Array.isArray(data) ? data : [data];
        for (const l of locations) {
          if (!l.id) continue;
          await client.query(
            `INSERT INTO locations (id, name, type, address, responsible_person, contact_phone, data, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               type = EXCLUDED.type,
               address = EXCLUDED.address,
               responsible_person = EXCLUDED.responsible_person,
               contact_phone = EXCLUDED.contact_phone,
               data = EXCLUDED.data,
               updated_at = CURRENT_TIMESTAMP`,
            [
              l.id,
              l.name || '',
              l.type || 'Warehouse',
              l.address || '',
              l.responsiblePerson || l.responsible_person || '',
              l.contactPhone || l.contact_phone || '',
              JSON.stringify(l),
            ]
          );
        }
        if (locations.length > 0) {
          const ids = locations.map((l) => l.id).filter(Boolean);
          await client.query(`DELETE FROM locations WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM locations');
        }
        break;
      }

      case 'apex_erp_cost_types': {
        const costTypes = Array.isArray(data) ? data : [data];
        for (const ct of costTypes) {
          if (!ct.id) continue;
          await client.query(
            `INSERT INTO cost_types (id, name, description, is_system)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               description = EXCLUDED.description,
               is_system = EXCLUDED.is_system`,
            [ct.id, ct.name || '', ct.description || '', ct.isSystem || false]
          );
        }
        if (costTypes.length > 0) {
          const ids = costTypes.map((c) => c.id).filter(Boolean);
          await client.query(`DELETE FROM cost_types WHERE id NOT IN (${ids.map((_, idx) => `$${idx + 1}`).join(',')})`, ids);
        } else {
          await client.query('DELETE FROM cost_types');
        }
        break;
      }

      case 'apex_erp_audit_logs': {
        const logs = Array.isArray(data) ? data : [data];
        for (const log of logs) {
          if (!log.id) continue;
          await client.query(
            `INSERT INTO audit_logs (id, action, entity, entity_id, job_id, user_name, role, reason, old_value, new_value, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO NOTHING`,
            [
              log.id,
              log.action || '',
              log.entity || '',
              log.entityId || log.entity_id || '',
              log.jobId || log.job_id || '',
              log.userName || log.user_name || '',
              log.role || '',
              log.reason || '',
              log.oldValue || log.old_value || '',
              log.newValue || log.new_value || '',
            ]
          );
        }
        break;
      }

      case 'apex_erp_notifications': {
        const notifs = Array.isArray(data) ? data : [data];
        for (const n of notifs) {
          if (!n.id) continue;
          await client.query(
            `INSERT INTO notifications (id, title, message, type, read, date, data)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               message = EXCLUDED.message,
               type = EXCLUDED.type,
               read = EXCLUDED.read,
               date = EXCLUDED.date,
               data = EXCLUDED.data`,
            [
              n.id,
              n.title || '',
              n.message || '',
              n.type || 'info',
              n.read || false,
              n.date || '',
              JSON.stringify(n),
            ]
          );
        }
        break;
      }

      default:
        // No specific relational mapping needed for this key
        break;
    }
  } catch (err) {
    console.warn(`Warning syncing relational table for ${key}:`, err);
  }
}

