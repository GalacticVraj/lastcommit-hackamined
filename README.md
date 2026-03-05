<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=280&section=header&text=TechMicra%20ERP&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=🏭%20Production-Grade%20Enterprise%20Resource%20Planning%20System&descAlignY=58&descAlign=50&descSize=18" width="100%"/>

</div>

<div align="center">

```
███████╗██████╗ ██████╗
██╔════╝██╔══██╗██╔══██╗
█████╗  ██████╔╝██████╔╝
██╔══╝  ██╔══██╗██╔═══╝
███████╗██║  ██║██║
╚══════╝╚═╝  ╚═╝╚═╝  Enterprise Resource Planning
```

</div>

<div align="center">

[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Laravel](https://img.shields.io/badge/Laravel_11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![MySQL](https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PHP](https://img.shields.io/badge/PHP_8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Hackathon](https://img.shields.io/badge/🏆_TechMicra-National_Hackathon-gold?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Active_Development-00f5ff?style=for-the-badge)](#)

</div>

<br/>

<div align="center">

```
╔══════════════════════════════════════════════════════════════════╗
║                    👥  TEAM  LAST  COMMIT                        ║
╠══════════════════════════════════════════════════════════════════╣
║  🧠  Jenil Paghdar      →   Lead Architect & Team Captain        ║
║  ⚡  Preetansh Devpura   →   Full Stack Developer                 ║
║  🎨  Vraj Talati         →   Frontend Engineer & UI/UX            ║
╚══════════════════════════════════════════════════════════════════╝
```

</div>

---

<div align="center">

## ✨ What is TechMicra ERP?

</div>

> **TechMicra ERP** is a **national-hackathon-grade**, full-stack Enterprise Resource Planning system purpose-built for Indian manufacturing companies. It unifies **13 modules**, **50+ sub-modules**, automated GST compliance, AI-powered production forecasting, WhatsApp payment reminders, barcode inventory, and role-based access — all in one platform.

<br/>

<div align="center">

| 🏭 | 💼 | 🛒 | 💰 | 👥 |
|:---:|:---:|:---:|:---:|:---:|
| **Production** | **Sales** | **Purchase** | **Finance** | **HR** |
| BOM · CRP · MRP | Inquiry→Invoice | Indent→GRN | Vouchers · P&L | Payroll · Advances |

| 🔍 | 🏪 | 📋 | 🚛 | 🔧 |
|:---:|:---:|:---:|:---:|:---:|
| **Quality** | **Warehouse** | **Statutory** | **Logistics** | **Maintenance** |
| IQC·PQC·PDI | Stock · Barcode | GST · TDS · TCS | Transport · Challan | Tools · Calibration |

</div>

---

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REACT 18 + VITE                               │
│                                                                       │
│   ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│   │  Zustand │  │ React Query │  │ React Hook   │  │    Zod     │  │
│   │  (State) │  │  (Server)   │  │    Form      │  │ (Validate) │  │
│   └──────────┘  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                                       │
│   ┌──────────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│   │  Recharts        │  │  ApexCharts   │  │    shadcn/ui        │  │
│   │  (Dashboards)    │  │  (Simulation) │  │  + Tailwind CSS     │  │
│   └──────────────────┘  └───────────────┘  └─────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                                │  REST API  /api/v1/
                                │  Bearer Token (Sanctum)
┌──────────────────────────────▼──────────────────────────────────────┐
│                      LARAVEL 11 BACKEND                               │
│                                                                       │
│   Route → Middleware → Controller → Service → Model → Database       │
│              (Auth)     (Thin)    (Logic)  (Eloquent)                │
│                                                                       │
│   ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐   │
│   │   Sanctum    │  │    Spatie      │  │   Laravel Queues     │   │
│   │    (Auth)    │  │  Permissions   │  │  Email · WhatsApp    │   │
│   │              │  │   (RBAC)       │  │  PDF Generation      │   │
│   └──────────────┘  └────────────────┘  └──────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                                │  Eloquent ORM
┌──────────────────────────────▼──────────────────────────────────────┐
│                         MySQL 8.0                                     │
│          45+ Tables  ·  FK Constraints  ·  Soft Deletes              │
│          Indexes on status, date, FK columns                          │
└──────────────────────────────┬──────────────────────────────────────┘
                                │  Async Jobs
┌──────────────────────────────▼──────────────────────────────────────┐
│                    EXTERNAL SERVICES                                  │
│   📧 Mailgun (Email)  ·  💬 Twilio (WhatsApp)  ·  📄 DomPDF         │
│   📊 Barcode Generator  ·  🔔 Pusher (Real-time)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Module Overview

<div align="center">

| # | Module | Sub-Modules | Key Features | Priority |
|:-:|--------|:-----------:|--------------|:--------:|
| 1 | 💼 **Sales Management** | 9 | Inquiry→SO→Invoice→Reminder→Receipt | `🔴 MUST` |
| 2 | 🛒 **Purchase Management** | 8 | Indent→PO→GRN→IQC→Bill→Payment | `🔴 MUST` |
| 3 | 🏭 **Production Management** | 10 | BOM·RouteCard·MaterialIssue·JobOrder | `🔴 MUST` |
| 4 | 🔮 **Production Simulation** | 3 | MRP·CRP·Provisional Costing Engine | `🔴 MUST` |
| 5 | 💰 **Finance Management** | 6 | Vouchers·BankRecon·P&L·BalanceSheet | `🟠 HIGH` |
| 6 | 👥 **HR Management** | 5 | Employee·Salary·Advances·Payroll | `🟠 HIGH` |
| 7 | 🔍 **Quality Management** | 5 | IQC·MTS·PQC·PDI·QRD | `🟠 HIGH` |
| 8 | 🏪 **Stores / Warehouse** | 5 | Stock·Barcode·Transfer·SRV | `🟠 HIGH` |
| 9 | 📋 **Statutory / GST** | 9 | GSTR1·GST2A·TDS·TCS·BalSheet | `🟠 HIGH` |
| 10 | 🚛 **Logistics** | 4 | Transport·Order·Challan·FreightBill | `🟡 SHOW` |
| 11 | 👷 **Contractors HR** | 6 | ContractLabour·Payroll·Payment | `🟡 SHOW` |
| 12 | 🔧 **Maintenance** | 4 | ToolMaster·Chart·Calibration·Memo | `🟡 SHOW` |
| 13 | 🏗️ **Asset Management** | 5 | Register·Addition·Depreciation·Sale | `🟡 SHOW` |

</div>

---

## 🔮 Production Simulation Engine

> 🏆 **The Flagship Feature** — technically the most impressive module.

```
  INPUT  →  Master Production Schedule (MPS)
  ┌─────────────────────────────────────────┐
  │  20 × Alto   +  30 × Swift  +  25 × Baleno  │
  │  Shift: 10 hrs/day   Workers: 50            │
  └─────────────────────────────────────────┘
               │
               ▼  STEP 1: MRP — Reverse BOM Explosion
  ┌─────────────────────────────────────────┐
  │  Steel Sheet   →  Need 850kg  Have 620kg  ❌ │
  │  Rubber Seals  →  Need 400pc  Have 520pc  ✅ │
  │  Engine Gasket →  Need  75pc  Have  30pc  ❌ │
  │  Material Readiness: 72.5%                   │
  └─────────────────────────────────────────┘
               │
               ▼  STEP 2: CRP — Capacity Planning
  ┌─────────────────────────────────────────┐
  │  Total Man-Hours Required  =  1,875 hrs     │
  │  Days Required  =  1875 ÷ (50 × 10) = 3.75 │
  │  Estimated Completion: March 09, 2024       │
  └─────────────────────────────────────────┘
               │
               ▼  STEP 3: Provisional Costing
  ┌─────────────────────────────────────────┐
  │  💰 Labor Cost       →  ₹ 1,31,250         │
  │  📦 Material Cost    →  ₹ 9,80,000         │
  │  ⚡ Electricity Cost →  ₹    28,750         │
  │  ─────────────────────────────────────      │
  │  🏷️  TOTAL COST      →  ₹ 12,40,000        │
  └─────────────────────────────────────────┘
```

---

## 💳 Automated Payment Reminder System

```
  Invoice Created
       │
       ▼
  Due Date = Invoice Date + Customer Credit Period
       │
       ├──── T - 7 days ──► 📧 Email + 💬 WhatsApp  "Payment Upcoming"
       │
       ├──── T - 3 days ──► 📧 Email + 💬 WhatsApp  "Reminder: Due Soon"
       │
       ├──── T - 0 days ──► 📧 Email + 💬 WhatsApp  "Payment Due TODAY"
       │
       └──── Overdue    ──► 📧 Email + 💬 WhatsApp  "⚠️ URGENT: Overdue"
                                (repeats daily until paid)
                                (frequency by mode: Strict/Moderate/Lenient)

  All sends → logged to communication_logs
              { invoice_id, channel, sent_at, status: read/delivered/failed }
```

---

## 🔐 RBAC — Role Based Access Control

```
  Super Admin
       │  creates & assigns
       ▼
  User  ──►  Role  ──►  Permissions
                         │
                         ├── sales.view
                         ├── sales.invoice.create
                         ├── sales.invoice.delete
                         ├── purchase.po.edit
                         ├── production.simulation.view
                         └── finance.voucher.approve
                              │
                              ▼
                    Laravel Middleware on every route
                    Frontend PermissionGate on every button
```

**Default Roles:** `super_admin` · `sales_manager` · `sales_executive` · `purchase_manager` · `production_head` · `accountant` · `hr_manager` · `warehouse_staff` · `viewer`

---

## 🚀 Quick Start

```bash
# ── Clone ────────────────────────────────────────────────────────
git clone https://github.com/YOUR_USERNAME/techmicra-erp.git
cd techmicra-erp

# ── Backend Setup ─────────────────────────────────────────────────
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Update .env → DB_DATABASE, DB_USERNAME, DB_PASSWORD
php artisan migrate --seed
php artisan queue:work &
php artisan serve
# ✅  API → http://localhost:8000/api/v1

# ── Frontend Setup ────────────────────────────────────────────────
cd ../frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000/api/v1
npm run dev
# ✅  App → http://localhost:5173
```

---

## 🔑 Demo Credentials

```
┌─────────────────────────────────────────────────────┐
│  Role               Email                 Password   │
├─────────────────────────────────────────────────────┤
│  Super Admin        admin@erp.com         admin@123  │
│  Sales Manager      sales@erp.com         sales@123  │
│  Production Head    prod@erp.com          prod@123   │
│  Accountant         accounts@erp.com      acct@123   │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Reports (20 Types)

<div align="center">

| # | Report | Filters |
|:-:|--------|---------|
| 1 | 📈 Sales Register | Date · Customer · Status |
| 2 | 📉 Purchase Register | Date · Vendor · Status |
| 3 | 📦 Stock Ledger | Item · Warehouse · Date |
| 4 | 💸 Receivables Ageing | Customer · 0-30 · 31-60 · 60+ days |
| 5 | 💳 Payables Ageing | Vendor · Ageing Buckets |
| 6 | 🏭 Daily Production Report | Date · Shift · Machine |
| 7 | 🔩 Material Consumption | Route Card · Item |
| 8 | 🧾 GST Summary | Month · IGST · CGST · SGST |
| 9 | 👥 Payroll Summary | Month · Department |
| 10 | ⏱️ Collection Efficiency | Customer · Delay Days |
| 11 | 🏆 Vendor Performance | On-Time % · Rejection % |
| 12 | 🏷️ Inventory Valuation | FIFO/Avg · Location |
| 13 | 👷 Job Work Summary | Contractor · Pending |
| 14 | 🏗️ Asset Depreciation Schedule | Asset · Year |
| 15 | 💰 Profit & Loss Statement | Period · Department |
| 16 | 📋 Balance Sheet | As-On Date |
| 17 | 🏦 Bank Reconciliation | Account · Statement |
| 18 | 📑 TDS / TCS Summary | Section · Deductee |
| 19 | 🔮 Production Simulation Result | MPS · Cost · Days |
| 20 | 📨 Communication Log | Channel · Status · Date |

</div>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|-----------|---------|
| ⚛️ Frontend | React 18 + Vite | SPA, hot reload, component architecture |
| 🎨 UI Library | Tailwind CSS + shadcn/ui | Utility-first + accessible components |
| 🗃️ State | Zustand + React Query | Global state + server cache |
| 📊 Charts | Recharts + ApexCharts | Dashboards + simulation visuals |
| 📝 Forms | React Hook Form + Zod | Validation + dynamic arrays |
| 🔙 Backend | Laravel 11 | REST API, queues, events |
| 🗄️ Database | MySQL 8.0 | Relational, FK constraints, soft deletes |
| 🔐 Auth | Laravel Sanctum | SPA token authentication |
| 🛡️ RBAC | Spatie Permissions | Module + page-level access control |
| 📧 Email | Mailgun | Transactional emails |
| 💬 WhatsApp | Twilio | Payment reminder messages |
| 📄 PDF | Laravel DomPDF | Invoice, PO, quotation export |
| 🏷️ Barcode | php-barcode-generator | Item CODE_128 barcodes |

</div>

---

## 📁 Project Structure

```
techmicra-erp/
│
├── backend/                          ← Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/          ← Thin (validate + delegate)
│   │   │   │   ├── Sales/
│   │   │   │   ├── Purchase/
│   │   │   │   ├── Production/
│   │   │   │   └── ...
│   │   │   ├── Middleware/
│   │   │   │   └── CheckPermission.php
│   │   │   └── Requests/             ← All validation
│   │   ├── Services/                 ← ALL business logic
│   │   │   ├── Sales/
│   │   │   │   ├── StockCheckService.php
│   │   │   │   ├── InvoiceService.php
│   │   │   │   └── CollectionReminderService.php
│   │   │   └── Production/
│   │   │       └── SimulationService.php
│   │   ├── Models/
│   │   ├── Jobs/                     ← Email, WhatsApp, PDF
│   │   └── Traits/
│   │       └── AutoNumberGenerator.php
│   └── database/
│       ├── migrations/               ← 45+ migration files
│       └── seeders/                  ← Demo data
│
└── frontend/                         ← React 18 + Vite
    └── src/
        ├── components/
        │   ├── shared/               ← DataTable, FormModal, StatCard
        │   └── layout/               ← Sidebar, Header
        ├── modules/
        │   ├── sales/
        │   ├── purchase/
        │   ├── production/
        │   └── ...                   ← 13 modules
        ├── stores/
        │   └── authStore.js          ← Zustand: user + permissions
        └── hooks/
            └── usePermission.js      ← RBAC hook
```

---

## 🔌 API Standards

```
Base URL:  /api/v1/

Response envelope (always):
{
  "success": true,
  "message": "Sale order created",
  "data": { ... },
  "pagination": { "current_page": 1, "total": 148 }
}

Query params (all list endpoints):
  ?search=         → Global search
  ?per_page=25     → Pagination
  ?sort_by=        → Column sort
  ?sort_order=asc  → Direction
  ?filters[status]=Pending
  ?date_from=&date_to=
```

---

## 🌿 Git Branch Strategy

```
main                ← Demo-ready, stable
  └── dev           ← Integration branch
        ├── feat/sales-module
        ├── feat/production-simulation
        ├── feat/payment-reminders
        ├── fix/invoice-gst-calc
        └── ui/dashboard-redesign

Commit convention:
  feat:     New feature
  fix:      Bug fix
  ui:       Frontend/design changes
  db:       Migration or schema change
  refactor: Code improvement
  docs:     Documentation
```

---

## 🏆 Hackathon Demo — 60 Second Script

```
0:00 → Login as Super Admin. Show 13-module sidebar.

0:10 → Sales: Create Inquiry → auto stock check fires →
        delivery date calculated → Quotation PDF generated.

0:25 → Production Simulation: enter 20 Alto + 30 Swift →
        MRP shows shortage rows in red → CRP: "3.8 days" →
        Cost card: "₹12.4 Lakhs provisional."

0:40 → Switch to Sales Executive (limited user) →
        Delete buttons vanish. "RBAC works per page, per action."

0:50 → Dashboard: live charts, stat cards, 20 report types,
        each exportable as PDF or CSV.
```

---

<div align="center">

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   "Built not just to demo — built to scale."           │
│                                                         │
│        🏆  TechMicra National Hackathon  🏆             │
│                                                         │
│   Jenil Paghdar  ·  Preetansh Devpura  ·  Vraj Talati  │
│                   Team Last Commit                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer&animation=fadeIn" width="100%"/>

</div>
