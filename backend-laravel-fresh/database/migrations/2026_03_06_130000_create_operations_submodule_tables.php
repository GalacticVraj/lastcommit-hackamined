<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('IQCRecord')) {
            Schema::table('IQCRecord', function (Blueprint $table) {
                if (!Schema::hasColumn('IQCRecord', 'sampleQty')) {
                    $table->decimal('sampleQty', 15, 2)->default(0)->after('productId');
                }
                if (!Schema::hasColumn('IQCRecord', 'visualCheck')) {
                    $table->string('visualCheck')->nullable()->after('sampleQty');
                }
                if (!Schema::hasColumn('IQCRecord', 'dimensionCheck')) {
                    $table->string('dimensionCheck')->nullable()->after('visualCheck');
                }
                if (!Schema::hasColumn('IQCRecord', 'deletedAt')) {
                    $table->timestamp('deletedAt')->nullable()->after('updatedAt');
                }
            });
        }

        Schema::create('QualityMTS', function (Blueprint $table) {
            $table->id();
            $table->string('mtaRef')->unique();
            $table->unsignedBigInteger('productId')->nullable();
            $table->decimal('qtyChecked', 15, 2)->default(0);
            $table->enum('status', ['OK', 'Damaged'])->default('OK');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('QualityPQC', function (Blueprint $table) {
            $table->id();
            $table->string('routeCardRef');
            $table->string('stageName');
            $table->string('operator');
            $table->text('observations')->nullable();
            $table->string('status')->default('Open');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('QualityPDI', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('saleOrderId')->nullable();
            $table->string('soRef')->nullable();
            $table->string('boxNo');
            $table->string('packagingCondition');
            $table->string('labelAccuracy');
            $table->string('overallResult')->default('Pending');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('QualityQRD', function (Blueprint $table) {
            $table->id();
            $table->string('rejectionId')->unique();
            $table->unsignedBigInteger('productId')->nullable();
            $table->string('item')->nullable();
            $table->decimal('qty', 15, 2)->default(0);
            $table->enum('action', ['Scrap', 'Return', 'Rework', 'Downgrade']);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorWorker', function (Blueprint $table) {
            $table->id();
            $table->string('workerId')->unique();
            $table->unsignedBigInteger('vendorId')->nullable();
            $table->string('workerName');
            $table->enum('skillLevel', ['Skilled', 'Unskilled'])->default('Unskilled');
            $table->string('aadharNo')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorSalaryHead', function (Blueprint $table) {
            $table->id();
            $table->string('role');
            $table->decimal('dailyRate', 15, 2)->default(0);
            $table->decimal('overtimeRate', 15, 2)->default(0);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorSalaryStructure', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workerId');
            $table->string('role');
            $table->decimal('applicableDailyRate', 15, 2)->default(0);
            $table->decimal('overtimeRate', 15, 2)->default(0);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorSalarySheet', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workerId');
            $table->unsignedBigInteger('vendorId')->nullable();
            $table->string('month');
            $table->integer('year');
            $table->decimal('daysWorked', 10, 2)->default(0);
            $table->decimal('overtimeHours', 10, 2)->default(0);
            $table->decimal('dailyRate', 15, 2)->default(0);
            $table->decimal('overtimeRate', 15, 2)->default(0);
            $table->decimal('totalPayable', 15, 2)->default(0);
            $table->string('status')->default('Draft');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorAdvance', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vendorId')->nullable();
            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->text('remarks')->nullable();
            $table->string('status')->default('Issued');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ContractorVoucherPayment', function (Blueprint $table) {
            $table->id();
            $table->string('voucherNo')->unique();
            $table->unsignedBigInteger('vendorId')->nullable();
            $table->unsignedBigInteger('salarySheetId')->nullable();
            $table->decimal('netAmountPaid', 15, 2)->default(0);
            $table->decimal('tdsDeducted', 15, 2)->default(0);
            $table->date('paymentDate');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ToolMaster', function (Blueprint $table) {
            $table->id();
            $table->string('assetCode')->unique();
            $table->string('toolName');
            $table->string('location')->nullable();
            $table->integer('maintenanceIntervalDays')->default(30);
            $table->boolean('isActive')->default(true);
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ToolMaintenanceChart', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('toolId');
            $table->date('scheduledDate');
            $table->text('taskList')->nullable();
            $table->string('status')->default('Scheduled');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ToolCalibrationReport', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('toolId');
            $table->date('calibrationDate');
            $table->decimal('standardValue', 15, 3)->default(0);
            $table->decimal('actualValue', 15, 3)->default(0);
            $table->enum('result', ['Pass', 'Fail'])->default('Pass');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('ToolRectificationMemo', function (Blueprint $table) {
            $table->id();
            $table->string('jobId')->unique();
            $table->unsignedBigInteger('toolId');
            $table->text('issue');
            $table->text('sparesUsed')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('technician')->nullable();
            $table->string('status')->default('Open');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('WarehouseOpening', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('warehouseId')->nullable();
            $table->unsignedBigInteger('productId');
            $table->decimal('openingQty', 15, 2)->default(0);
            $table->decimal('value', 15, 2)->default(0);
            $table->date('date');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('DispatchSRV', function (Blueprint $table) {
            $table->id();
            $table->string('srvNo')->unique();
            $table->date('date');
            $table->string('partyName');
            $table->unsignedBigInteger('productId');
            $table->decimal('qty', 15, 2)->default(0);
            $table->boolean('returnExpected')->default(false);
            $table->date('returnExpectedDate')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('WarehouseStockTransfer', function (Blueprint $table) {
            $table->id();
            $table->string('transferId')->unique();
            $table->unsignedBigInteger('fromWarehouseId')->nullable();
            $table->unsignedBigInteger('toWarehouseId')->nullable();
            $table->unsignedBigInteger('productId');
            $table->decimal('qty', 15, 2)->default(0);
            $table->string('status')->default('Transferred');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('WarehouseMaterialReceipt', function (Blueprint $table) {
            $table->id();
            $table->string('receiptId')->unique();
            $table->string('sourceDocRef')->nullable();
            $table->unsignedBigInteger('warehouseId')->nullable();
            $table->unsignedBigInteger('productId');
            $table->decimal('qtyReceived', 15, 2)->default(0);
            $table->date('receiptDate');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('FixedAssetMaster', function (Blueprint $table) {
            $table->id();
            $table->string('assetTag')->unique();
            $table->string('name');
            $table->enum('assetGroup', ['IT', 'Plant', 'Furniture'])->default('IT');
            $table->date('purchaseDate')->nullable();
            $table->decimal('value', 15, 2)->default(0);
            $table->decimal('currentValue', 15, 2)->default(0);
            $table->decimal('depreciationRate', 8, 2)->default(0);
            $table->string('status')->default('Active');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('AssetAdditionMemo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assetId');
            $table->string('invoiceRef')->nullable();
            $table->date('installationDate')->nullable();
            $table->decimal('depreciationRate', 8, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('AssetAllocationMaster', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assetId');
            $table->unsignedBigInteger('employeeId')->nullable();
            $table->string('employeeName')->nullable();
            $table->string('department')->nullable();
            $table->date('dateAssigned')->nullable();
            $table->string('status')->default('Allocated');
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('AssetSaleMemo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('assetId');
            $table->date('saleDate');
            $table->decimal('saleValue', 15, 2)->default(0);
            $table->decimal('bookValue', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });

        Schema::create('AssetDepreciationVoucher', function (Blueprint $table) {
            $table->id();
            $table->integer('year');
            $table->unsignedBigInteger('assetId');
            $table->decimal('openingBalance', 15, 2)->default(0);
            $table->decimal('depreciationAmount', 15, 2)->default(0);
            $table->decimal('closingBalance', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('createdBy')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('deletedAt')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('AssetDepreciationVoucher');
        Schema::dropIfExists('AssetSaleMemo');
        Schema::dropIfExists('AssetAllocationMaster');
        Schema::dropIfExists('AssetAdditionMemo');
        Schema::dropIfExists('FixedAssetMaster');
        Schema::dropIfExists('WarehouseMaterialReceipt');
        Schema::dropIfExists('WarehouseStockTransfer');
        Schema::dropIfExists('DispatchSRV');
        Schema::dropIfExists('WarehouseOpening');
        Schema::dropIfExists('ToolRectificationMemo');
        Schema::dropIfExists('ToolCalibrationReport');
        Schema::dropIfExists('ToolMaintenanceChart');
        Schema::dropIfExists('ToolMaster');
        Schema::dropIfExists('ContractorVoucherPayment');
        Schema::dropIfExists('ContractorAdvance');
        Schema::dropIfExists('ContractorSalarySheet');
        Schema::dropIfExists('ContractorSalaryStructure');
        Schema::dropIfExists('ContractorSalaryHead');
        Schema::dropIfExists('ContractorWorker');
        Schema::dropIfExists('QualityQRD');
        Schema::dropIfExists('QualityPDI');
        Schema::dropIfExists('QualityPQC');
        Schema::dropIfExists('QualityMTS');

        if (Schema::hasTable('IQCRecord')) {
            Schema::table('IQCRecord', function (Blueprint $table) {
                if (Schema::hasColumn('IQCRecord', 'sampleQty')) {
                    $table->dropColumn('sampleQty');
                }
                if (Schema::hasColumn('IQCRecord', 'visualCheck')) {
                    $table->dropColumn('visualCheck');
                }
                if (Schema::hasColumn('IQCRecord', 'dimensionCheck')) {
                    $table->dropColumn('dimensionCheck');
                }
                if (Schema::hasColumn('IQCRecord', 'deletedAt')) {
                    $table->dropColumn('deletedAt');
                }
            });
        }
    }
};
