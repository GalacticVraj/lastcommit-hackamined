<?php
/**
 * Laravel Migration — Core ERP Tables
 * Mirrors the Prisma schema from the Node.js backend
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── AUTH & RBAC ───────────────────────────────────────────────────────
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('module');
            $table->string('action');
            $table->string('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['module', 'action']);
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('action');
            $table->string('entity');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ── SALES ─────────────────────────────────────────────────────────────
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gstin')->nullable();
            $table->string('state_code')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('pincode')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->integer('credit_period')->default(30);
            $table->string('reminder_mode')->default('Moderate');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('inquiry_no')->unique();
            $table->foreignId('customer_id')->constrained();
            $table->timestamp('inquiry_date')->useCurrent();
            $table->string('sales_person')->nullable();
            $table->string('status')->default('New');
            $table->text('remarks')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quote_no')->unique();
            $table->unsignedBigInteger('inquiry_id')->nullable();
            $table->foreignId('customer_id')->constrained();
            $table->timestamp('quote_date')->useCurrent();
            $table->timestamp('valid_until');
            $table->string('payment_terms')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sale_orders', function (Blueprint $table) {
            $table->id();
            $table->string('so_no')->unique();
            $table->unsignedBigInteger('quotation_id')->nullable();
            $table->foreignId('customer_id')->constrained();
            $table->string('customer_po_no')->nullable();
            $table->timestamp('customer_po_date')->nullable();
            $table->text('billing_address')->nullable();
            $table->text('shipping_address')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sale_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('product_id');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2);
            $table->decimal('gst_percent', 5, 2)->default(18);
            $table->decimal('total', 15, 2);
            $table->string('status')->default('Pending');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->unsignedBigInteger('sale_order_id')->nullable();
            $table->foreignId('customer_id')->constrained();
            $table->timestamp('invoice_date')->useCurrent();
            $table->timestamp('due_date');
            $table->string('place_of_supply')->nullable();
            $table->string('eway_bill_no')->nullable();
            $table->decimal('taxable_value', 15, 2)->default(0);
            $table->decimal('cgst_amount', 15, 2)->default(0);
            $table->decimal('sgst_amount', 15, 2)->default(0);
            $table->decimal('igst_amount', 15, 2)->default(0);
            $table->decimal('round_off', 10, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('status')->default('Unpaid');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sales_receipt_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no')->unique();
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->foreignId('customer_id')->constrained();
            $table->timestamp('receipt_date')->useCurrent();
            $table->decimal('amount', 15, 2);
            $table->string('payment_mode');
            $table->string('reference_no')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── PRODUCTS ──────────────────────────────────────────────────────────
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('unit')->default('PCS');
            $table->string('hsn_code')->nullable();
            $table->float('gst_percent')->default(18);
            $table->float('current_stock')->default(0);
            $table->float('blocked_stock')->default(0);
            $table->float('reorder_level')->default(0);
            $table->float('last_purchase_price')->default(0);
            $table->integer('production_days')->default(7);
            $table->float('man_hours_per_unit')->default(0);
            $table->float('machine_hours_per_unit')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── SIMULATION ────────────────────────────────────────────────────────
        Schema::create('simulation_runs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('run_date')->useCurrent();
            $table->float('shift_hours')->default(10);
            $table->integer('worker_count')->default(50);
            $table->float('total_man_hours')->default(0);
            $table->float('total_machine_hours')->default(0);
            $table->float('days_required')->default(0);
            $table->float('labor_cost')->default(0);
            $table->float('electricity_cost')->default(0);
            $table->float('material_cost')->default(0);
            $table->float('total_cost')->default(0);
            $table->float('material_readiness')->default(0);
            $table->boolean('is_saved')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('simulation_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('simulation_run_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('product_id');
            $table->float('target_qty');
            $table->float('man_hours')->default(0);
            $table->float('machine_hours')->default(0);
            $table->float('material_cost')->default(0);
        });

        // ── AUTO COUNTERS ─────────────────────────────────────────────────────
        Schema::create('auto_counters', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->unsignedBigInteger('value')->default(0);
        });

        // ── EMPLOYEES (HR) ────────────────────────────────────────────────────
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('emp_code')->unique();
            $table->string('name');
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->string('mobile')->nullable();
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── VENDORS (Purchase) ────────────────────────────────────────────────
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gstin')->nullable();
            $table->string('state_code')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        $tables = [
            'auto_counters', 'simulation_products', 'simulation_runs',
            'sales_receipt_vouchers', 'invoices', 'sale_order_items', 'sale_orders',
            'quotations', 'inquiries', 'customers', 'products', 'employees', 'vendors',
            'audit_logs', 'role_permissions', 'user_roles', 'permissions', 'roles', 'users',
        ];
        foreach ($tables as $t) Schema::dropIfExists($t);
    }
};
