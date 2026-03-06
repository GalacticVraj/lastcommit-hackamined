<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 4.1. Voucher Journal - Adjustment Entry
        Schema::create('voucher_journals', function (Blueprint $table) {
            $table->id();
            $table->string('journalNo')->unique();
            $table->date('date');
            $table->string('debitAccount');
            $table->string('creditAccount');
            $table->decimal('amount', 15, 2);
            $table->text('narration')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // 4.2. Voucher Payment & Receipt - Bank/Cash transactions
        Schema::create('voucher_payment_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->enum('voucherType', ['Payment', 'Receipt']);
            $table->date('date');
            $table->string('partyName');
            $table->decimal('amount', 15, 2);
            $table->enum('mode', ['Cash', 'Bank', 'Cheque', 'Online', 'UPI', 'Card']);
            $table->string('referenceNo')->nullable();
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // 4.3. Voucher Contra - Cash Deposit/Withdrawal
        Schema::create('voucher_contras', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->date('date');
            $table->string('fromAccount');
            $table->string('toAccount');
            $table->decimal('amount', 15, 2);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        // 4.4. Journal Voucher (GST) - Tax Adjustments
        Schema::create('voucher_gsts', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->date('date');
            $table->enum('gstLedger', ['Input', 'Output']);
            $table->enum('adjustmentType', ['Reversal', 'Adjustment', 'Correction', 'Refund']);
            $table->decimal('amount', 15, 2);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_journals');
        Schema::dropIfExists('voucher_payment_receipts');
        Schema::dropIfExists('voucher_contras');
        Schema::dropIfExists('voucher_gsts');
    }
};
