<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ═══════════════════════════════════════════
        // AUTH & RBAC
        // ═══════════════════════════════════════════

        Schema::create('User', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('isActive')->default(true);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('Role', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->boolean('isActive')->default(true);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('Permission', function (Blueprint $table) {
            $table->id();
            $table->string('module');
            $table->string('action');
            $table->string('description')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['module', 'action']);
        });

        Schema::create('UserRole', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->unsignedBigInteger('roleId');
            $table->unique(['userId', 'roleId']);
        });

        Schema::create('RolePermission', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('roleId');
            $table->unsignedBigInteger('permissionId');
            $table->unique(['roleId', 'permissionId']);
        });

        Schema::create('AuditLog', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->string('action');
            $table->string('entity');
            $table->unsignedBigInteger('entityId')->nullable();
            $table->text('details')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('AutoCounter', function (Blueprint $table) {
            $table->id();
            $table->string('prefix')->unique();
            $table->integer('currentValue')->default(0);
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // SALES MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('Customer', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gstin')->nullable();
            $table->string('stateCode')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('pincode')->nullable();
            $table->string('contactPerson')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->integer('creditPeriod')->default(30);
            $table->string('reminderMode')->default('Moderate');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('Inquiry', function (Blueprint $table) {
            $table->id();
            $table->string('inquiryNo')->unique();
            $table->unsignedBigInteger('customerId');
            $table->timestamp('inquiryDate')->useCurrent();
            $table->string('salesPerson')->nullable();
            $table->string('status')->default('New');
            $table->text('remarks')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('InquiryItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inquiryId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('targetPrice', 15, 2)->nullable();
            $table->decimal('netAvailable', 15, 2)->nullable();
            $table->timestamp('deliveryDate')->nullable();
        });

        Schema::create('Quotation', function (Blueprint $table) {
            $table->id();
            $table->string('quoteNo')->unique();
            $table->unsignedBigInteger('inquiryId')->nullable();
            $table->unsignedBigInteger('customerId');
            $table->timestamp('quoteDate')->useCurrent();
            $table->timestamp('validUntil');
            $table->string('paymentTerms')->nullable();
            $table->decimal('totalAmount', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('QuotationItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quotationId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2);
            $table->decimal('gstPercent', 5, 2)->default(18);
            $table->decimal('total', 15, 2);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('SaleOrder', function (Blueprint $table) {
            $table->id();
            $table->string('soNo')->unique();
            $table->unsignedBigInteger('quotationId')->nullable();
            $table->unsignedBigInteger('customerId');
            $table->string('customerPoNo')->nullable();
            $table->timestamp('customerPoDate')->nullable();
            $table->text('billingAddress')->nullable();
            $table->text('shippingAddress')->nullable();
            $table->decimal('totalAmount', 15, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('SaleOrderItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('saleOrderId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2);
            $table->decimal('gstPercent', 5, 2)->default(18);
            $table->decimal('total', 15, 2);
            $table->string('status')->default('Pending');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('Invoice', function (Blueprint $table) {
            $table->id();
            $table->string('invoiceNo')->unique();
            $table->unsignedBigInteger('saleOrderId')->nullable();
            $table->unsignedBigInteger('customerId');
            $table->timestamp('invoiceDate')->useCurrent();
            $table->timestamp('dueDate');
            $table->string('placeOfSupply')->nullable();
            $table->string('ewayBillNo')->nullable();
            $table->decimal('taxableValue', 15, 2)->default(0);
            $table->decimal('cgstAmount', 15, 2)->default(0);
            $table->decimal('sgstAmount', 15, 2)->default(0);
            $table->decimal('igstAmount', 15, 2)->default(0);
            $table->decimal('roundOff', 15, 2)->default(0);
            $table->decimal('grandTotal', 15, 2)->default(0);
            $table->string('status')->default('Unpaid');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('InvoiceItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoiceId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2);
            $table->decimal('gstPercent', 5, 2)->default(18);
            $table->decimal('cgst', 15, 2)->default(0);
            $table->decimal('sgst', 15, 2)->default(0);
            $table->decimal('igst', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('SalesReceiptVoucher', function (Blueprint $table) {
            $table->id();
            $table->string('receiptNo')->unique();
            $table->unsignedBigInteger('customerId');
            $table->unsignedBigInteger('invoiceId')->nullable();
            $table->timestamp('receiptDate')->useCurrent();
            $table->decimal('amount', 15, 2);
            $table->string('paymentMode')->default('Cash');
            $table->string('chequeNo')->nullable();
            $table->string('bankRef')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('CollectionReminder', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoiceId');
            $table->string('triggerType');
            $table->timestamp('scheduledAt');
            $table->timestamp('sentAt')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('CommunicationLog', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoiceId');
            $table->string('channel');
            $table->text('content')->nullable();
            $table->string('status')->default('Sent');
            $table->timestamp('sentAt')->useCurrent();
        });

        Schema::create('DispatchAdvice', function (Blueprint $table) {
            $table->id();
            $table->string('dispatchNo')->unique();
            $table->unsignedBigInteger('saleOrderId');
            $table->unsignedBigInteger('transporterId')->nullable();
            $table->string('vehicleNo')->nullable();
            $table->string('driverName')->nullable();
            $table->timestamp('dispatchDate')->useCurrent();
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // ═══════════════════════════════════════════
        // PURCHASE MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('Vendor', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gstin')->nullable();
            $table->string('stateCode')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('pincode')->nullable();
            $table->string('contactPerson')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->integer('creditPeriod')->default(30);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('PurchaseOrder', function (Blueprint $table) {
            $table->id();
            $table->string('poNo')->unique();
            $table->unsignedBigInteger('vendorId');
            $table->string('vendorQuotationNo')->nullable();
            $table->timestamp('poDate')->useCurrent();
            $table->timestamp('expectedDelivery')->nullable();
            $table->decimal('totalAmount', 15, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('PurchaseOrderItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchaseOrderId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2);
            $table->decimal('gstPercent', 5, 2)->default(18);
            $table->decimal('total', 15, 2);
            $table->string('status')->default('Pending');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('GRN', function (Blueprint $table) {
            $table->id();
            $table->string('grnNo')->unique();
            $table->unsignedBigInteger('vendorId');
            $table->unsignedBigInteger('purchaseOrderId')->nullable();
            $table->string('challanNo')->nullable();
            $table->timestamp('grnDate')->useCurrent();
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('GRNItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grnId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('acceptedQty', 15, 2)->default(0);
            $table->decimal('rejectedQty', 15, 2)->default(0);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('PurchaseBill', function (Blueprint $table) {
            $table->id();
            $table->string('billNo')->unique();
            $table->unsignedBigInteger('vendorId');
            $table->unsignedBigInteger('purchaseOrderId')->nullable();
            $table->string('vendorInvoiceNo')->nullable();
            $table->timestamp('billDate')->useCurrent();
            $table->timestamp('dueDate')->nullable();
            $table->decimal('taxableValue', 15, 2)->default(0);
            $table->decimal('cgstAmount', 15, 2)->default(0);
            $table->decimal('sgstAmount', 15, 2)->default(0);
            $table->decimal('igstAmount', 15, 2)->default(0);
            $table->decimal('grandTotal', 15, 2)->default(0);
            $table->string('status')->default('Unpaid');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('PurchasePaymentVoucher', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->unsignedBigInteger('vendorId');
            $table->unsignedBigInteger('purchaseBillId')->nullable();
            $table->timestamp('paymentDate')->useCurrent();
            $table->decimal('amount', 15, 2);
            $table->string('paymentMode')->default('Cash');
            $table->string('chequeNo')->nullable();
            $table->string('bankRef')->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('PurchaseSchedule', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchaseOrderId');
            $table->unsignedBigInteger('productId');
            $table->timestamp('scheduledDate');
            $table->decimal('quantity', 15, 2);
            $table->string('status')->default('Pending');
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // PRODUCTION MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('Product', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('subCategory')->nullable();
            $table->string('unit')->default('Nos');
            $table->string('hsnCode')->nullable();
            $table->decimal('gstPercent', 5, 2)->default(18);
            $table->decimal('minStock', 15, 2)->default(0);
            $table->decimal('currentStock', 15, 2)->default(0);
            $table->decimal('lastPurchasePrice', 15, 2)->default(0);
            $table->decimal('lastSalePrice', 15, 2)->default(0);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('BOMHeader', function (Blueprint $table) {
            $table->id();
            $table->string('bomNo')->unique();
            $table->unsignedBigInteger('productId');
            $table->string('version')->default('1.0');
            $table->timestamp('effectiveFrom')->useCurrent();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('BOMItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bomHeaderId');
            $table->unsignedBigInteger('componentId');
            $table->decimal('quantity', 15, 4);
            $table->string('unit')->default('Nos');
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('RoutingTable', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bomHeaderId');
            $table->integer('operationNo');
            $table->string('operationName');
            $table->string('workCenter')->nullable();
            $table->decimal('setupTime', 10, 2)->default(0);
            $table->decimal('cycleTime', 10, 2)->default(0);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('ProductionRouteCard', function (Blueprint $table) {
            $table->id();
            $table->string('routeCardNo')->unique();
            $table->unsignedBigInteger('productId');
            $table->unsignedBigInteger('bomHeaderId')->nullable();
            $table->string('batchNo')->nullable();
            $table->decimal('planQty', 15, 2);
            $table->decimal('actualQty', 15, 2)->default(0);
            $table->string('status')->default('Planned');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ProductionReport', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('routeCardId')->nullable();
            $table->unsignedBigInteger('productId');
            $table->timestamp('reportDate')->useCurrent();
            $table->decimal('productionQty', 15, 2);
            $table->decimal('rejectionQty', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('JobOrder', function (Blueprint $table) {
            $table->id();
            $table->string('jobOrderNo')->unique();
            $table->string('contractorName');
            $table->string('processRequired');
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('JobOrderItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('jobOrderId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->decimal('rate', 15, 2)->default(0);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('JobChallan', function (Blueprint $table) {
            $table->id();
            $table->string('challanNo')->unique();
            $table->unsignedBigInteger('jobOrderId');
            $table->string('challanType');
            $table->timestamp('challanDate')->useCurrent();
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('JobWorkBill', function (Blueprint $table) {
            $table->id();
            $table->string('billNo')->unique();
            $table->unsignedBigInteger('jobOrderId');
            $table->timestamp('billDate')->useCurrent();
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // HR MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('Employee', function (Blueprint $table) {
            $table->id();
            $table->string('empCode')->unique();
            $table->string('name');
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->timestamp('doj')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('panNo')->nullable();
            $table->string('aadharNo')->nullable();
            $table->string('bankName')->nullable();
            $table->string('bankAccount')->nullable();
            $table->string('ifscCode')->nullable();
            $table->decimal('basicSalary', 15, 2)->default(0);
            $table->decimal('hra', 15, 2)->default(0);
            $table->decimal('da', 15, 2)->default(0);
            $table->decimal('otherAllowances', 15, 2)->default(0);
            $table->boolean('esicApplicable')->default(false);
            $table->boolean('pfApplicable')->default(false);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->unsignedBigInteger('updatedBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('EmployeeSalarySheet', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employeeId');
            $table->string('month');
            $table->integer('year');
            $table->integer('totalDays')->default(30);
            $table->integer('presentDays')->default(0);
            $table->integer('absentDays')->default(0);
            $table->decimal('grossSalary', 15, 2)->default(0);
            $table->decimal('deductions', 15, 2)->default(0);
            $table->decimal('pfDeduction', 15, 2)->default(0);
            $table->decimal('esicDeduction', 15, 2)->default(0);
            $table->decimal('tdsDeduction', 15, 2)->default(0);
            $table->decimal('otherDeductions', 15, 2)->default(0);
            $table->decimal('netPay', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // Salary Head Master - Define salary components
        Schema::create('SalaryHead', function (Blueprint $table) {
            $table->id();
            $table->string('headName');
            $table->string('headCode')->unique();
            $table->enum('headType', ['Earning', 'Deduction']);
            $table->text('description')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // Employee Salary Structure - Assign pay structure to employees
        Schema::create('EmployeeSalaryStructure', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employeeId');
            $table->date('effectiveDate');
            $table->decimal('basic', 15, 2)->default(0);
            $table->decimal('hra', 15, 2)->default(0);
            $table->decimal('da', 15, 2)->default(0);
            $table->decimal('pfPercent', 5, 2)->default(12);
            $table->decimal('esicPercent', 5, 2)->default(0.75);
            $table->decimal('otherAllowances', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // Employee Advance Memo - Loan/Advance tracking
        Schema::create('EmployeeAdvance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employeeId');
            $table->date('advanceDate');
            $table->decimal('amount', 15, 2);
            $table->string('purpose');
            $table->string('recoveryMonth');
            $table->integer('recoveryMonths')->default(1);
            $table->decimal('monthlyDeduction', 15, 2)->default(0);
            $table->decimal('recoveredAmount', 15, 2)->default(0);
            $table->decimal('balanceAmount', 15, 2)->default(0);
            $table->enum('status', ['Pending', 'Approved', 'Partially Recovered', 'Fully Recovered', 'Cancelled'])->default('Pending');
            $table->text('remarks')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('approvedBy')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // ═══════════════════════════════════════════
        // QUALITY MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('IQCRecord', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('grnId')->nullable();
            $table->unsignedBigInteger('productId');
            $table->decimal('totalQty', 15, 2);
            $table->decimal('acceptedQty', 15, 2)->default(0);
            $table->decimal('rejectedQty', 15, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('inspectorId')->nullable();
            $table->timestamp('inspectionDate')->useCurrent();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // WAREHOUSE MANAGEMENT
        // ═══════════════════════════════════════════

        Schema::create('Warehouse', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('managerName')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('MaterialIndent', function (Blueprint $table) {
            $table->id();
            $table->string('indentNo')->unique();
            $table->string('department');
            $table->string('requestedBy');
            $table->timestamp('indentDate')->useCurrent();
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('MaterialIndentItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('materialIndentId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('MaterialIssue', function (Blueprint $table) {
            $table->id();
            $table->string('issueNo')->unique();
            $table->unsignedBigInteger('materialIndentId')->nullable();
            $table->unsignedBigInteger('warehouseId');
            $table->timestamp('issueDate')->useCurrent();
            $table->string('issuedTo');
            $table->string('status')->default('Issued');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('MaterialIssueItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('materialIssueId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('MaterialReceipt', function (Blueprint $table) {
            $table->id();
            $table->string('receiptNo')->unique();
            $table->unsignedBigInteger('warehouseId');
            $table->timestamp('receiptDate')->useCurrent();
            $table->string('receivedFrom');
            $table->string('status')->default('Received');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('MaterialReceiptItem', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('materialReceiptId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('MaterialTransfer', function (Blueprint $table) {
            $table->id();
            $table->string('transferNo')->unique();
            $table->unsignedBigInteger('fromWarehouseId');
            $table->unsignedBigInteger('toWarehouseId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantity', 15, 2);
            $table->string('status')->default('Pending');
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // LOGISTICS
        // ═══════════════════════════════════════════

        Schema::create('Transporter', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ownerName')->nullable();
            $table->string('mobile')->nullable();
            $table->string('gstin')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // ═══════════════════════════════════════════
        // FINANCE (JournalVoucher for legacy support)
        // ═══════════════════════════════════════════

        Schema::create('JournalVoucher', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->string('voucherType')->nullable();
            $table->string('debitAccount')->nullable();
            $table->string('creditAccount')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->text('narration')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('BankReconciliation', function (Blueprint $table) {
            $table->id();
            $table->string('bankAccount');
            $table->timestamp('statementDate')->useCurrent();
            $table->decimal('systemBalance', 15, 2)->default(0);
            $table->decimal('bankBalance', 15, 2)->default(0);
            $table->string('status')->default('Pending');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('CreditCardStatement', function (Blueprint $table) {
            $table->id();
            $table->string('cardNo');
            $table->string('statementMonth');
            $table->string('merchant')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamp('transactionDate')->useCurrent();
            $table->string('expenseHead')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        // ═══════════════════════════════════════════
        // SIMULATION
        // ═══════════════════════════════════════════

        Schema::create('SimulationRun', function (Blueprint $table) {
            $table->id();
            $table->string('runNo')->unique();
            $table->string('name')->nullable();
            $table->string('status')->default('Running');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('SimulationInput', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('runId');
            $table->string('paramName');
            $table->text('paramValue')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('SimulationProduct', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('runId');
            $table->unsignedBigInteger('productId');
            $table->decimal('quantitySold', 15, 2)->default(0);
            $table->decimal('revenue', 15, 2)->default(0);
            $table->decimal('profit', 15, 2)->default(0);
            $table->timestamp('createdAt')->useCurrent();
        });

        Schema::create('SimulationResult', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('runId');
            $table->string('metric');
            $table->decimal('value', 15, 2)->default(0);
            $table->timestamp('createdAt')->useCurrent();
        });

        // ═══════════════════════════════════════════
        // SEED DEFAULT DATA
        // ═══════════════════════════════════════════

        // Create default admin user
        DB::table('User')->insert([
            'id' => 1,
            'name' => 'Admin',
            'email' => 'admin@erp.com',
            'password' => Hash::make('password'),
            'isActive' => true,
        ]);

        // Create default roles
        DB::table('Role')->insert([
            ['id' => 1, 'name' => 'admin', 'description' => 'Full access administrator'],
            ['id' => 2, 'name' => 'manager', 'description' => 'Department manager'],
            ['id' => 3, 'name' => 'user', 'description' => 'Regular user'],
        ]);

        // Assign admin role to admin user
        DB::table('UserRole')->insert([
            'userId' => 1,
            'roleId' => 1,
        ]);

        // Create permissions for all modules
        $modules = ['sales', 'purchase', 'production', 'finance', 'hr', 'quality', 'warehouse', 'statutory', 'logistics', 'contractors', 'maintenance', 'assets', 'reports', 'simulation'];
        $actions = ['view', 'create', 'edit', 'delete'];
        $permId = 1;
        foreach ($modules as $module) {
            foreach ($actions as $action) {
                DB::table('Permission')->insert([
                    'id' => $permId,
                    'module' => $module,
                    'action' => $action,
                    'description' => ucfirst($action) . ' ' . $module,
                ]);
                // Give admin role all permissions
                DB::table('RolePermission')->insert([
                    'roleId' => 1,
                    'permissionId' => $permId,
                ]);
                $permId++;
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'SimulationResult', 'SimulationProduct', 'SimulationInput', 'SimulationRun',
            'CreditCardStatement', 'BankReconciliation', 'JournalVoucher',
            'Transporter',
            'MaterialTransfer', 'MaterialReceiptItem', 'MaterialReceipt', 'MaterialIssueItem', 'MaterialIssue',
            'MaterialIndentItem', 'MaterialIndent', 'Warehouse',
            'IQCRecord',
            'EmployeeAdvance', 'EmployeeSalaryStructure', 'SalaryHead', 'EmployeeSalarySheet', 'Employee',
            'JobWorkBill', 'JobChallan', 'JobOrderItem', 'JobOrder',
            'ProductionReport', 'ProductionRouteCard', 'RoutingTable', 'BOMItem', 'BOMHeader', 'Product',
            'PurchaseSchedule', 'PurchasePaymentVoucher', 'PurchaseBill', 'GRNItem', 'GRN',
            'PurchaseOrderItem', 'PurchaseOrder', 'Vendor',
            'DispatchAdvice', 'CommunicationLog', 'CollectionReminder',
            'SalesReceiptVoucher', 'InvoiceItem', 'Invoice',
            'SaleOrderItem', 'SaleOrder', 'QuotationItem', 'Quotation',
            'InquiryItem', 'Inquiry', 'Customer',
            'AutoCounter', 'AuditLog', 'RolePermission', 'UserRole', 'Permission', 'Role', 'User',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
