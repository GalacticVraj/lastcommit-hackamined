<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=260&section=header&text=feat%2Fpreetansh-logic&fontSize=52&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=⚡%20Core%20Logic%20Engineer%20·%20TechMicra%20ERP%20·%20Team%20Last%20Commit&descAlignY=58&descAlign=50&descSize=16" width="100%"/>

</div>

<div align="center">

```
██████╗ ██████╗ ███████╗███████╗████████╗ █████╗ ███╗   ██╗███████╗██╗  ██╗
██╔══██╗██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██║  ██║
██████╔╝██████╔╝█████╗  █████╗     ██║   ███████║██╔██╗ ██║███████╗███████║
██╔═══╝ ██╔══██╗██╔══╝  ██╔══╝     ██║   ██╔══██║██║╚██╗██║╚════██║██╔══██║
██║     ██║  ██║███████╗███████╗   ██║   ██║  ██║██║ ╚████║███████║██║  ██║
╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
                        D E V P U R A
```

</div>

<div align="center">

[![Branch](https://img.shields.io/badge/Branch-feat%2Fpreetansh--logic-a855f7?style=for-the-badge&logo=git&logoColor=white)](#)
[![Role](https://img.shields.io/badge/Role-Full_Stack_Logic_Engineer-00f5ff?style=for-the-badge)](#)
[![Backend](https://img.shields.io/badge/Laravel_11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](#)
[![Frontend](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)](#)
[![Hackathon](https://img.shields.io/badge/🏆_TechMicra-National_Hackathon-gold?style=for-the-badge)](#)

</div>

<br/>

<div align="center">

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    ⚡  PREETANSH DEVPURA  ⚡                                          ║
║                                                                      ║
║    Role      →   Full Stack Logic Engineer                           ║
║    Branch    →   feat/preetansh-logic                                ║
║    Owns      →   Auth · RBAC · Purchase · Quality · HR · Reports     ║
║    Team      →   Last Commit  |  TechMicra ERP Hackathon             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

</div>

---

## 🧠 What This Branch Contains

This branch holds **all core business logic, backend services, API endpoints, and frontend module pages** contributed by Preetansh Devpura to the TechMicra ERP system.

Every file in this branch follows the principle:

> **"Controllers stay thin. All logic lives in Service classes. DB writes use transactions. Security is never an afterthought."**

---

## 📦 Modules Owned by Preetansh

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🔐  Authentication & RBAC System          ← FOUNDATION        │
│   🛒  Purchase Management Module            ← FULL OWNER        │
│   🔍  Quality Management Module             ← FULL OWNER        │
│   👥  HR & Payroll Module                   ← FULL OWNER        │
│   📊  Report Builder (all 20 reports)       ← FULL OWNER        │
│   💾  Database Schema & Migrations          ← CO-OWNER          │
│   🔒  Security Middleware & Guards          ← FULL OWNER        │
│   📨  API Standards & Response Envelope     ← FULL OWNER        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Module 1 — Authentication & RBAC

> The security backbone of the entire ERP. Every other module depends on this.

```
LOGIN FLOW:
  POST /api/v1/auth/login
       │
       ▼
  Validate email + password (FormRequest)
       │
       ▼
  Check credentials → Hash compare
       │
       ├── ❌ Wrong → Return 401 "Invalid credentials" + increment fail count
       │             After 5 fails → lock for 15 mins → return 429
       │
       └── ✅ Correct → Create Sanctum token
                       → Load user permissions array from Spatie
                       → Return { token, user, permissions[] }
                              │
                              ▼
                       React stores token in localStorage
                       Zustand stores user + permissions
                       Axios interceptor attaches token to all future requests
                       Redirect → /dashboard
```

**Files contributed:**

```
backend/
├── app/Http/Controllers/AuthController.php
├── app/Http/Requests/LoginRequest.php
├── app/Http/Middleware/CheckPermission.php
├── app/Http/Middleware/RateLimitLogin.php
├── app/Services/AuthService.php
├── database/seeders/RolesAndPermissionsSeeder.php
└── routes/api.php  (auth routes + all protected route groups)

frontend/
├── src/stores/authStore.js          (Zustand: token, user, permissions)
├── src/lib/axios.js                 (interceptors: attach token, handle 401)
├── src/hooks/usePermission.js       (RBAC hook)
├── src/components/PermissionGate.jsx
├── src/router/ProtectedRoute.jsx
└── src/modules/auth/pages/LoginPage.jsx
```

**Permission naming convention used:**

```
sales.view               purchase.view            hr.view
sales.create             purchase.create          hr.create
sales.edit               purchase.edit            hr.edit
sales.delete             purchase.delete          hr.delete
sales.invoice.create     purchase.po.approve      hr.payroll.run
sales.dispatch           purchase.grn.create      quality.view
production.view          finance.voucher.approve  reports.export
production.simulation    finance.balance_sheet    admin.users
```

---

## 🛒 Module 2 — Purchase Management

> Full purchase cycle from material indent to vendor payment.

```
PURCHASE FLOW:

  Material Indent (internal request)
       │  auto-number: IND-2024-00001
       ▼
  Purchase Order → Vendor
       │  auto-number: PO-2024-00001
       │  status: Draft → Approved → Sent → Closed
       ▼
  Purchase Schedule (track expected delivery)
       │  follow-up status: On-Time / Delayed
       ▼
  GRN — Goods Receipt Note (gate entry)
       │  auto-number: GRN-2024-00001
       │  links to: PO, Vendor Challan, Vehicle No
       ▼
  IQC — Incoming Quality Check
       │  Sample size, Accepted Qty, Rejected Qty
       │  If rejected → trigger QRD (Quality Rejection Decision)
       ▼
  Material Receipt → Stock added to warehouse
       │  warehouse_stocks.quantity += accepted_qty  (DB transaction)
       ▼
  Purchase Billbook → log vendor invoice
       │  auto-match PO rate vs Bill rate → flag mismatch
       ▼
  Vendor Payment Voucher
       │  amount, bank account, TDS deduction
       └── updates vendor outstanding balance
```

**Key logic written:**

```php
// StockReceiptService.php
// When GRN + IQC both approved, add to stock atomically
DB::transaction(function () use ($grn, $iqc) {
    $accepted = $iqc->accepted_qty;
    WarehouseStock::where('product_id', $grn->product_id)
        ->where('warehouse_id', $grn->warehouse_id)
        ->lockForUpdate()
        ->increment('quantity', $accepted);

    MaterialReceipt::create([...]);
    $grn->update(['status' => 'completed']);
});
```

```php
// AutoNumberGenerator.php (Trait)
// Race-condition-safe document numbering
DB::transaction(function () use ($prefix) {
    $last = static::where('prefix', $prefix)
                  ->whereYear('created_at', now()->year)
                  ->lockForUpdate()
                  ->max('sequence_no');
    return $prefix . '-' . now()->year . '-' . str_pad($last + 1, 5, '0', STR_PAD_LEFT);
});
```

**Files contributed:**

```
backend/app/Http/Controllers/Purchase/
├── MaterialIndentController.php
├── PurchaseOrderController.php
├── PurchaseScheduleController.php
├── GrnController.php
├── IqcController.php
├── MaterialReceiptController.php
├── PurchaseBillController.php
└── VendorPaymentController.php

backend/app/Services/Purchase/
├── PurchaseOrderService.php
├── GrnService.php
├── IqcService.php
├── StockReceiptService.php        ← DB transaction: GRN approval → stock++
├── BillMatchingService.php        ← PO rate vs Bill rate mismatch detection
└── VendorPaymentService.php

backend/database/migrations/
├── create_material_indents_table.php
├── create_purchase_orders_table.php
├── create_grns_table.php
├── create_iqc_records_table.php
└── create_purchase_bills_table.php

frontend/src/modules/purchase/
├── pages/IndentListPage.jsx
├── pages/PurchaseOrderPage.jsx
├── pages/GrnPage.jsx
├── pages/IqcPage.jsx
├── pages/BillbookPage.jsx
└── components/PurchaseOrderForm.jsx
```

---

## 🔍 Module 3 — Quality Management

> Quality checkpoints at every stage — incoming, in-process, and pre-dispatch.

```
QUALITY CHECKPOINTS:

  IQC  (Incoming Quality Control)
  ├── Triggered after every GRN
  ├── Fields: GRN Ref, Item, Total Qty, Sample Size, Accepted Qty, Rejected Qty
  └── Result: Pass → Material Receipt  |  Fail → QRD

  MTS  (Material Transfer Slip check)
  ├── Triggered during inter-department material movement
  └── Fields: MTA Ref, Item, Qty Checked, Status (OK / Damaged)

  PQC  (Process Quality Control)
  ├── In-process checks at each production stage
  └── Fields: Route Card Ref, Stage, Operator, Observations, Pass/Fail

  PDI  (Pre-Dispatch Inspection)
  ├── Final check before dispatch to customer
  └── Fields: SO Ref, Box No, Packaging Condition, Label Accuracy

  QRD  (Quality Rejection Decision)
  ├── Handles all rejected material
  └── Action: Scrap | Return to Vendor | Rework | Downgrade
              │           │                │           │
              ▼           ▼                ▼           ▼
          write off   raise debit      re-enter     adjust
          stock       note to vendor   production   price
```

**Files contributed:**

```
backend/app/Services/Quality/
├── IqcService.php
├── PqcService.php
├── PdiService.php
└── QrdService.php            ← Routes rejection to correct action handler

frontend/src/modules/quality/
├── pages/IqcPage.jsx
├── pages/PqcPage.jsx
├── pages/PdiPage.jsx
└── pages/QrdPage.jsx
```

---

## 👥 Module 4 — HR & Payroll

> Complete HR cycle from employee onboarding to monthly payroll.

```
PAYROLL CALCULATION LOGIC:

  Employee Master
  ├── Basic Salary, HRA, DA, Special Allowance
  ├── PF % (employer + employee), ESI %
  └── Bank Account for direct transfer

  Monthly Salary Sheet:
  ┌────────────────────────────────────────────────┐
  │  EARNINGS                                      │
  │  Basic Salary          =  base amount          │
  │  HRA                   =  40% of Basic         │
  │  DA                    =  configurable %        │
  │  Special Allowance     =  fixed amount          │
  │  ─────────────────────────────────────         │
  │  GROSS SALARY          =  sum of above         │
  │                                                │
  │  DEDUCTIONS                                    │
  │  PF (Employee share)   =  12% of Basic         │
  │  ESI                   =  0.75% of Gross       │
  │  Advance Recovery      =  from advance_memos   │
  │  TDS                   =  as applicable        │
  │  ─────────────────────────────────────         │
  │  NET PAY               =  Gross - Deductions   │
  └────────────────────────────────────────────────┘

  Advance Recovery Logic:
  When salary sheet is generated, auto-fetch all pending
  advance_memos for the employee and deduct installment
  amounts. Mark memo as "Recovered" when balance hits 0.
```

**Files contributed:**

```
backend/app/Services/HR/
├── EmployeeService.php
├── SalaryStructureService.php
├── PayrollService.php             ← Full gross/deduction/net calculation
├── AdvanceMemoService.php         ← Auto-recovery on payroll run
└── SalarySheetExportService.php   ← PDF + CSV export

frontend/src/modules/hr/
├── pages/EmployeeListPage.jsx
├── pages/EmployeeProfilePage.jsx  ← Clickable profile with full stats
├── pages/SalaryStructurePage.jsx
├── pages/SalarySheetPage.jsx
└── pages/AdvanceMemoPage.jsx
```

---

## 📊 Module 5 — Report Builder (All 20 Reports)

> Single ReportViewer component powers all 20 report types dynamically.

```
ARCHITECTURE:

  ReportConfig (per report type)
  {
    title,
    apiEndpoint,
    columns: [{ key, label, type, sortable }],
    filters: [{ key, label, type: date|select|search }],
    summaryFields: [{ key, label, aggregate: sum|count|avg }]
  }
       │
       ▼
  <ReportViewer config={ReportConfig} />
       │
       ├── Renders filter bar dynamically from config.filters
       ├── Fetches data from config.apiEndpoint with filter params
       ├── Renders DataTable with config.columns
       ├── Renders summary totals row from config.summaryFields
       ├── Export CSV  → download filtered data as .csv
       └── Export PDF  → call /api/v1/reports/{type}/pdf → open in new tab
```

**20 Reports built:**

```
01. Sales Register              11. Vendor Performance
02. Purchase Register           12. Inventory Valuation
03. Stock Ledger                13. Job Work Summary
04. Receivables Ageing          14. Asset Depreciation Schedule
05. Payables Ageing             15. Profit & Loss Statement
06. Daily Production Report     16. Balance Sheet
07. Material Consumption        17. Bank Reconciliation Summary
08. GST Summary                 18. TDS / TCS Summary
09. Payroll Summary             19. Production Simulation Result
10. Collection Efficiency       20. Communication Log Report
```

**Files contributed:**

```
backend/app/Http/Controllers/Reports/
└── ReportController.php           ← Single controller, 20 methods

backend/app/Services/Reports/
├── SalesReportService.php
├── PurchaseReportService.php
├── StockReportService.php
├── FinanceReportService.php
├── HrReportService.php
└── PdfReportService.php           ← DomPDF export for all types

frontend/src/modules/reports/
├── ReportViewer.jsx               ← Universal report component
├── reportConfigs.js               ← Config for all 20 report types
└── pages/ReportsIndexPage.jsx
```

---

## 🔒 Security Implementations

```
✅  Auth middleware on every protected route (auth:sanctum)
✅  CheckPermission middleware on every write operation
✅  Rate limiting: 5 login attempts → 15 min lockout
✅  DB transactions on all multi-table writes
✅  Soft deletes on all transactional tables (never hard delete)
✅  created_by / updated_by auto-fill via global Laravel observer
✅  Stock cannot go below zero (guard check before every issue)
✅  Money stored as decimal(12,2), never float
✅  Auto-increment document numbers use SELECT FOR UPDATE (race-safe)
✅  Input validation via Laravel Form Requests on every endpoint
✅  401 → auto logout + redirect to login (axios interceptor)
✅  Session timeout: 60 min inactivity → auto logout
✅  PermissionGate on every button/action in React
✅  API response never exposes passwords or internal tokens
```

---

## 🌿 Branch Strategy

```
main
  └── dev
        └── feat/preetansh-logic    ← THIS BRANCH
              │
              ├── All commits follow convention:
              │     feat:  new feature
              │     fix:   bug fix
              │     db:    migration / schema
              │     refactor: logic improvement
              │
              └── Merges into dev via PR
                  (reviewed by Jenil before merge)
```

---

## 📈 Contribution Stats

<div align="center">

| Area | Files | Key Responsibility |
|------|:-----:|--------------------|
| 🔐 Auth & RBAC | 9 | Login, token, permissions, middleware |
| 🛒 Purchase Module | 18 | Full 8-step purchase cycle + stock logic |
| 🔍 Quality Module | 8 | IQC · MTS · PQC · PDI · QRD |
| 👥 HR & Payroll | 10 | Employee master, payroll engine, advances |
| 📊 Reports | 25 | 20 report types, PDF/CSV export |
| 🔒 Security | 6 | Middleware, guards, rate limiting |
| 💾 Database | 22 | Migrations, indexes, seeders |
| **Total** | **98+** | **Core logic foundation of TechMicra ERP** |

</div>

---

<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   "Logic is the foundation.                              ║
║    If the logic is wrong, nothing else matters."         ║
║                                                          ║
║            ⚡  Preetansh Devpura                         ║
║            Full Stack Logic Engineer                     ║
║            Team Last Commit · TechMicra ERP 2024         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=120&section=footer&animation=fadeIn" width="100%"/>

</div>
