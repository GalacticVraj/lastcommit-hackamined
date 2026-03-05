# TechMicra ERP — Laravel Backend

This is the Laravel backend for the TechMicra ERP system, running alongside the existing Node.js backend.

## Prerequisites

- PHP >= 8.1
- Composer
- SQLite (default) or MySQL/PostgreSQL

## Quick Start

```bash
# 1. Install dependencies
cd backend-laravel
composer install

# 2. Setup environment
cp .env.example .env
php artisan key:generate

# 3. Create SQLite database
touch database/erp.sqlite

# 4. Run migrations
php artisan migrate

# 5. Seed initial data (admin user + roles)
php artisan db:seed

# 6. Start the server on port 8001
php artisan serve --port=8001
```

## API

All endpoints are prefixed with `/api/v1/` to match the Node.js backend.

| Module       | Base Path               | Status       |
|-------------|-------------------------|--------------|
| Auth         | `/api/v1/auth`           | ✅ Full      |
| Sales        | `/api/v1/sales`          | ✅ Full      |
| Production   | `/api/v1/production`     | ✅ Full      |
| Simulation   | `/api/v1/simulation`     | ✅ Full      |
| Purchase     | `/api/v1/purchase`       | 🔧 Stub      |
| Finance      | `/api/v1/finance`        | 🔧 Stub      |
| HR           | `/api/v1/hr`             | 🔧 Stub      |
| Quality      | `/api/v1/quality`        | 🔧 Stub      |
| Warehouse    | `/api/v1/warehouse`      | 🔧 Stub      |
| Statutory    | `/api/v1/statutory`      | 🔧 Stub      |
| Logistics    | `/api/v1/logistics`      | 🔧 Stub      |
| Contractors  | `/api/v1/contractors`    | 🔧 Stub      |
| Maintenance  | `/api/v1/maintenance`    | 🔧 Stub      |
| Assets       | `/api/v1/assets`         | 🔧 Stub      |

## Switching Frontend to Laravel

Update `VITE_API_URL` in `frontend/.env`:
```
VITE_API_URL=http://localhost:8001/api/v1
```

## Structure

```
backend-laravel/
├── app/
│   ├── Http/Controllers/Api/   # All API controllers
│   ├── Models/                 # Eloquent models (create as needed)
│   └── Services/               # GstCalculator, AutoNumber
├── database/migrations/        # Schema matching Prisma
├── routes/api.php              # All REST routes
├── .env.example                # Environment template
└── composer.json
```
