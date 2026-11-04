# ERP Master Build Prompt: Electrical Supply & Contracting

Prepared for Tamim Ansar. Paste this whole document into your AI coding tool (or share it with your dev team) as the single source of truth. Every module below is tied to one spine: the **Job ID**.

## 1. Role and Goal

You are a developer and UI/UX designer with 20 years of experience building business ERP systems. Build a production-quality web ERP for an **electrical supply and contracting company**. The app tracks every job end to end: quotation (BOQ), vendor rates, purchase, stock, site work, employees, expenses, client billing, and profit or loss. Every rupee and every item must be traceable to a **unique Job ID**.

The users include people with little formal education, so the app must feel like a simple, friendly tool and not like a typical AI-generated dashboard.

## 2. Tech Stack and Deployment

- React (Vite or Next.js), TypeScript preferred, deployable on **Vercel** with no extra server setup.
- Routing with React Router (or Next.js routes). State with React Query plus a light store (Zustand or Context).
- Put all data access behind a **service layer** (`/src/services`). Start with realistic mock data so the UI works immediately; the backend (recommended: Supabase/Postgres or Vercel serverless functions with Postgres) plugs in later without UI changes.
- Export: CSV for BOQ (same column format as the supplied samples), PDF for invoices and quotations.
- Mobile-first responsive layout; must work well on phones used at sites.

## 3. Design System and UX Rules (apply everywhere)

**Hard rules**

- **Light mode only.** No dark mode, no theme toggle.
- Must not look AI-generated: no purple gradients, no generic glassmorphism, no emoji-heavy UI. Use a calm, professional, industrial look.
- Fully responsive: phone, tablet, desktop. Tables become stacked cards on mobile. Touch targets at least 44px.
- Easy for non-readers: big buttons, clear icons beside every label, short plain words, status shown with color plus icon plus text, minimal steps per task, confirmation dialogs written in simple language.

**Global theme (define once, reuse everywhere)**

- A single `theme` file with design tokens: colors (primary, secondary, success, warning, danger, info, neutral scale, surface, border, text), typography scale, spacing scale, radius, shadows, breakpoints.
- A single shared component library, used by every page and never restyled per page: Button, IconButton, Input, Select, Searchable Select, Date Picker, Number Input, Textarea, Checkbox, Radio, Switch, Badge/StatusChip, Card, DataTable (with mobile card view), Tabs, Modal, Drawer, Toast, ConfirmDialog, EmptyState, Skeleton loader, Stepper, Timeline (for logs), Stat Card, Chart wrapper, FileUpload, PageHeader, FormSection.
- Suggested palette: deep blue as primary, amber as accent (electrical feel), green/amber/red for status, warm light grey background. Final values live only in the theme file.
- Global **error boundary**, global toast system, global API error handler, global loading and empty states, global form validation messages in simple language.

## 4. Roles and Privileges

Role-based access control with a permission matrix stored as data (admin can edit it). Default roles:

| Role | Main responsibility |
| --- | --- |
| Admin | Full control, approvals, rates, pricing, reports, user and privilege management |
| Purchase Manager | Raises purchases against jobs, vendor orders |
| Store Manager | Receives goods, issues stock, dispatches to site |
| Site Supervisor | Daily site entries, task progress, extra material requests, attendance |
| Accounts | Expenses, petty cash, invoices, payments, P&L view |
| Viewer (optional) | Read-only |

Rules: hide menu items the user cannot access, block routes, and hide or disable action buttons by permission. Every sensitive action (price change, approval, delete) is permission-gated and logged.

## 5. The Core Concept: Job ID

Every job gets a **unique, auto-generated Job ID** (default suggestion: `JOB-2026-0001`). Everything links to it: BOQ, quotation versions, purchases, stock movements, site tasks, employee attendance, expenses, invoices, payments, approvals, and logs. The **Job Detail page** is the hub, with tabs: Overview, BOQ/Quotation, Purchases, Stock, Tasks, Employees, Expenses, Billing, Profit & Loss, Activity Log.

## 6. Modules

### Module 1: Job Management

- Create a job: client (from Client Management), site/location, scope, dates, assigned people, status.
- Statuses: Draft, BOQ Prepared, Rates Pending, Quoted, Revision, Approved, In Progress, Completed.
- Job dashboard shows purchases vs stock vs vendors, quoted amount vs actual spend, and progress.

### Module 2: Item and Inventory Management

- Item master: name, specification (for example 1.5 Sq.mm wire red 300 mtrs), unit (Coil, Mtrs, Nos, Kgs, Set, Lot), category, default vendors, minimum stock level.
- Add new items and item lists in bulk (CSV import).
- Stock ledger columns: Sl no, Item, Unit, Received Qty, Issued Qty, **Stock on Site** (= received minus issued).
- Every stock record has a **location** (warehouse, store, or site) and a **responsible person** for that location.
- Stock may be mapped to a job or kept **unallocated** (general stock); allocation to a job can happen later.
- Stock movements: receive, issue, transfer between locations, return. Each one logs who, when, job, location.
- Low stock alerts.

### Module 3: BOQ (Bill of Quantities)

- Staff build the BOQ for a job: sections (for example PSW Transformers, Assembly Jig, Fan, Circuit Mains, Light Point Wiring), each with sub-items and sub-numbering (1, 2 and a, b, c).
- Columns: S.No, Description, Qty, Unit, Rate (Supply), Rate (Erection), Amount (Supply), Amount (Erection); section totals and Grand Total. Amount = Qty x Rate, automatic.
- Header block: client name and address, reference number, date, subject.
- After submission the BOQ **moves to Admin**. Admin enquires rates from outside vendors and enters **supply rate and erection rate** per line, selecting the **vendor** per item (vendor list comes from Vendor Management).
- Support both sample layouts supplied (two different quotation formats). CSV samples will be provided; **import and export must use the exact same column format**.
- BOQ has **versions** (v1, v2, v3) so each revision is kept.

### Module 4: Client Sharing, Revisions, Audit Log

- "Send to client" button opens the user's email app with the **subject and client email auto-filled** (mailto-style redirect, like ChatGPT's send email), plus the exported PDF/CSV for attaching. Client email comes from Client Management.
- If the client asks for a budget reduction, Admin reads the request manually and sets the quotation status.
- Any price or quote change uses an **Update** action with a **mandatory reason**.
- Every change is saved to the **Audit Log**: who, what, when, old value, new value, reason.
- After the client approves, Admin applies the final change in the app and the job moves to the next step.

### Module 5: Purchase Management

- The Purchase Manager purchases items **for a job**. Vendor defaults come from the vendor chosen during rate entry.
- Per item the screen shows: BOQ qty, already purchased qty, balance qty, quoted rate.
- Purchases are usually **partial** (for example 20 of 100 now, 30 later). Support multiple purchase entries per item.
- **Admin is notified** of every purchase with running totals (purchased vs quoted).
- **Approval rule:** if the purchase quantity exceeds the BOQ quantity, or the rate exceeds the quoted rate, the purchase cannot be confirmed until Admin approves a request containing a reason.
- Purchase orders and vendor bills are recorded; the **client invoice** (payment request) is generated from job and purchase data.

### Module 6: Store, Dispatch, Costs, Price History

- Purchased goods go to the **Store** (Store Manager receives and confirms qty) or are **sent directly to site**.
- **Dynamic cost types:** Transportation, Dispatch, Loading, and any new type Admin creates, with no code change. Costs attach to a purchase, dispatch, or job.
- Job dashboard shows **Quoted amount vs actual spend** (material + transport + dispatch + labor + other expenses), with a clear over-budget warning.
- **Price history (very important for purchase decisions):**
  - Per product: date, vendor, rate, qty, job (for example copper 700 this month, 800 next month).
  - Two views: **per job** (copper price history inside that job) and **overall** (all jobs, all vendors, trend chart plus vendor comparison).
  - While purchasing, show last purchase rate and lowest vendor rate beside the item.

### Module 7: Site Task Management

- A job has tasks (for example Fix 15 fans, one per day). Admin assigns the job and tasks to people.
- The Site Supervisor makes daily entries: task progress, quantity completed, notes, photos.
- Each task has **material mapping**: allowed quantity per unit of work (for example 1 fan = bracket, down rod, wire, clamp; 15 fans = 15 times that). Allowed material is calculated automatically.
- **Extra material request:** if more is needed than allowed, the supervisor enters a request with item, extra qty, and **reason** (what was measured or needed at that place). Admin approves or rejects.
- History log of who asked, whom, who raised, reason, decision. This supports future cost estimation and prevents misuse.
- **Job-level limit:** if a job's total allocation (for example 1000 m wire) is exceeded, the request goes to Admin with how much is needed, why, and the full usage history (where it was used so far).
- Allocation has three levels: **BOQ qty, then Job allocation, then Task allocation**. Crossing a limit triggers the request flow.
- Jobs can be marked **Completed** (with a check for pending tasks and returns).

### Module 8: Employee Tracking

- Employee master: name, phone, role, daily wage (optional), active status.
- Daily attendance **per job**: which employee worked on which job on which day (present, half day, absent, overtime).
- Views: per employee (days and jobs worked), per job (people and days), per day.
- Labor cost = days x wage, flowing automatically into the job's expenses and P&L.

### Module 9: Vendor Management

- Vendor master: name, contact, address, GST number (if any), categories supplied, payment terms.
- Vendor rate list and quotes received per item and date.
- Vendor history: orders, deliveries, payments, outstanding balance, price comparison across vendors.
- Vendor flow is set here and **mapped into BOQ rate entry and purchase**.

### Module 10: Client Management

- Client master: company name, contact persons, emails, phones, addresses, GST number.
- Linked jobs, quotations, invoices, payments received, outstanding.
- Clients added here feed the email-sharing feature (auto-filled recipient).

### Module 11: Accounts Management

- All money records are **matched to a Job ID**: material purchases, transport and dispatch, labor, **petty cash, food cash, travel, other expenses**.
- Expense entry: date, job, category (dynamic list), amount, paid by, bill photo, notes, approval status.
- Petty cash: issue cash to a person, record spends against jobs, reconcile the balance.
- Client billing: invoices (progress or final), payments received, balance due. Vendor payments and balances.
- Expenses without a job are flagged as "General/Overhead" and can be reallocated later.

### Module 12: Profit and Loss

- **Per job:** Revenue (approved quote or invoiced amount) minus costs (materials, transport, dispatch, labor, petty cash, food, other) = **Profit or Loss**, with margin %.
- Quoted vs actual comparison by BOQ line and by cost type.
- **Overall:** by period (month, quarter, year), by client, by vendor spend, top profitable and loss-making jobs.
- Clear green (profit) and red (loss) indicators; export to PDF and CSV.

### Module 13: Audit Log and Notifications (global)

- One audit log for the whole app: user, role, action, entity and ID, Job ID, old and new values, reason, timestamp. Read-only, filterable by job, user, date, action.
- Notifications: purchase made, approval needed, request approved or rejected, low stock, budget exceeded, job completed. Bell icon with unread count.

## 7. Approval Workflows (summary)

| Trigger | Raised by | Approved by | Reason required |
| --- | --- | --- | --- |
| Purchase qty above BOQ qty | Purchase Manager | Admin | Yes |
| Purchase rate above quoted rate | Purchase Manager | Admin | Yes |
| Extra material for a task | Site Supervisor | Admin | Yes |
| Material above job allocation | Site Supervisor | Admin | Yes |
| Quote/price change after sharing | Admin | Admin (after client approval) | Yes |
| Large or off-budget expense | Accounts | Admin | Yes |

Every request keeps its history: requested, approved or rejected, by whom, when, why.

## 8. Data Model (entities and links)

`Job` is the center. Key entities: User, Role, Permission, Client, Vendor, Employee, Item, Location, StockLedger, StockMovement, Job, BOQ (versions), BOQSection, BOQLine, VendorRate, Purchase, PurchaseLine, Invoice, Payment, Task, TaskMaterial, MaterialRequest, Attendance, CostType, Expense, PettyCash, PriceHistory, AuditLog, Notification.

Key relations:

- Job has one Client, many BOQ versions, tasks, purchases, expenses, invoices, attendance records.
- BOQLine references Item and chosen Vendor; PurchaseLine references BOQLine, Item, Vendor, Job.
- StockMovement references Item, Location, optional Job, user.
- Every Expense, Attendance, Purchase, StockMovement carries `jobId` (nullable only where stated).
- PriceHistory is written automatically on every confirmed purchase line.
- AuditLog is written automatically on every create, update, approval, and delete.

## 9. Navigation and Key Screens

- **Home:** role-based dashboard (Admin: pending approvals, budget alerts, active jobs; Store: pending receipts; Supervisor: today's tasks; Purchase: pending purchases).
- Menu: Jobs, BOQ, Purchases, Inventory, Site Tasks, Employees, Vendors, Clients, Accounts, Reports (P&L, Price History), Audit Log, Settings (Users, Roles, Cost Types, Units, Theme info).
- Mobile: bottom navigation with the 4 to 5 most-used items for the user's role, "More" for the rest, a floating primary action button, big search.

## 10. Suggested Folder Structure

`/src/theme` (tokens), `/src/components/ui` (shared library), `/src/components/layout`, `/src/features/{jobs,boq,purchases,inventory,tasks,employees,vendors,clients,accounts,reports,audit,auth}`, `/src/services` (API and mock data), `/src/hooks`, `/src/utils` (formatters, CSV, PDF, permissions), `/src/types`, `/src/routes`.

## 11. Build Order

1. Theme, shared components, layout, auth and roles, global error and toast handling.
2. Master data: Clients, Vendors, Items, Locations, Employees, Cost Types.
3. Jobs and Job Detail hub.
4. BOQ builder, import/export, version control, admin rate entry.
5. Email share, revisions, audit log.
6. Purchases with approval rules, notifications, price history.
7. Inventory and store, dispatch, dynamic costs.
8. Site tasks, material mapping, extra requests.
9. Employee attendance, accounts and petty cash.
10. Profit and loss, reports, polish, performance, Vercel deployment.

## 12. Acceptance Checklist

- Light mode only; all colors come from the global theme; no hard-coded colors in components.
- Every page works on a 360px-wide phone.
- A first-time, low-literacy user can finish: add attendance, request extra material, record an expense, in under 4 taps each where possible.
- Every record is traceable by Job ID.
- Every limit breach follows the approval flow and is logged with a reason.
- BOQ export matches the supplied sample format exactly.
- Audit log captures every change with old value, new value, and reason.
- Price history works per job and overall, with vendor comparison.
- Project builds cleanly and deploys on Vercel.
