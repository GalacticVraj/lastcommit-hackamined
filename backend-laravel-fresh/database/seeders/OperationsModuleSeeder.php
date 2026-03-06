<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OperationsModuleSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        if (!Schema::hasTable('Product') || !Schema::hasTable('Vendor')) {
            return;
        }

        $productIds = DB::table('Product')->orderBy('id')->limit(5)->pluck('id')->values();
        $vendorIds = DB::table('Vendor')->orderBy('id')->limit(3)->pluck('id')->values();

        if ($productIds->isEmpty() || $vendorIds->isEmpty()) {
            return;
        }

        $warehouseId = null;
        if (Schema::hasTable('Warehouse')) {
            $warehouseId = DB::table('Warehouse')->orderBy('id')->value('id');
            if (!$warehouseId) {
                $warehouseId = DB::table('Warehouse')->insertGetId([
                    'name' => 'Main Store',
                    'address' => 'Plant 1',
                    'managerName' => 'Store Manager',
                    'createdBy' => 1,
                    'createdAt' => $now,
                    'updatedAt' => $now,
                ]);
            }
        }

        $employeeId = Schema::hasTable('Employee') ? DB::table('Employee')->orderBy('id')->value('id') : null;

        $this->seedQuality($productIds, $now);
        $workerIds = $this->seedContractors($vendorIds, $now);
        $toolIds = $this->seedMaintenance($now);
        $this->seedWarehouse($warehouseId, $productIds, $now);
        $this->seedLogistics($now);
        $assetIds = $this->seedAssets($employeeId, $now);

        if (!empty($assetIds) && !empty($workerIds) && Schema::hasTable('ContractorSalarySheet')) {
            DB::table('ContractorSalarySheet')
                ->whereNull('deletedAt')
                ->whereNotIn('workerId', $workerIds)
                ->limit(2)
                ->update(['updatedAt' => $now]);
        }

        if (!empty($toolIds) && Schema::hasTable('ToolMaintenanceChart')) {
            DB::table('ToolMaintenanceChart')
                ->whereIn('toolId', $toolIds)
                ->whereNull('deletedAt')
                ->update(['updatedAt' => $now]);
        }
    }

    private function seedQuality($productIds, Carbon $now): void
    {
        if (Schema::hasTable('IQCRecord')) {
            foreach (range(0, 5) as $index) {
                DB::table('IQCRecord')->insert([
                    'grnId' => null,
                    'productId' => $productIds[$index % $productIds->count()],
                    'sampleQty' => 20 + $index,
                    'totalQty' => 20 + $index,
                    'acceptedQty' => 18 + $index,
                    'rejectedQty' => 2,
                    'visualCheck' => $index % 3 === 0 ? 'Fail' : 'Pass',
                    'dimensionCheck' => $index % 4 === 0 ? 'Fail' : 'Pass',
                    'status' => $index % 3 === 0 ? 'Fail' : 'Pass',
                    'remarks' => 'Quality seed data',
                    'inspectorId' => 1,
                    'inspectionDate' => $now->copy()->subMonths(5 - $index),
                    'createdAt' => $now->copy()->subMonths(5 - $index),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('QualityMTS')) {
            foreach (range(1, 4) as $index) {
                DB::table('QualityMTS')->updateOrInsert(
                    ['mtaRef' => "MTA-SEED-{$index}"],
                    [
                        'productId' => $productIds[$index % $productIds->count()],
                        'qtyChecked' => 10 * $index,
                        'status' => $index % 2 === 0 ? 'Damaged' : 'OK',
                        'remarks' => 'MTS seeded',
                        'createdBy' => 1,
                        'updatedAt' => $now,
                        'createdAt' => $now->copy()->subDays(10 * $index),
                        'deletedAt' => null,
                    ]
                );
            }
        }

        if (Schema::hasTable('QualityPQC')) {
            foreach (range(1, 5) as $index) {
                DB::table('QualityPQC')->insert([
                    'routeCardRef' => "RC-SEED-{$index}",
                    'stageName' => 'Stage ' . $index,
                    'operator' => 'Operator ' . $index,
                    'observations' => 'Process check',
                    'status' => $index % 2 === 0 ? 'Closed' : 'Open',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays($index * 6),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('QualityPDI')) {
            foreach (range(1, 4) as $index) {
                DB::table('QualityPDI')->insert([
                    'saleOrderId' => null,
                    'soRef' => "SO-SEED-{$index}",
                    'boxNo' => "BX-{$index}",
                    'packagingCondition' => $index % 2 === 0 ? 'Damaged' : 'Good',
                    'labelAccuracy' => $index % 2 === 0 ? 'Mismatch' : 'Accurate',
                    'overallResult' => $index % 2 === 0 ? 'Fail' : 'Pass',
                    'remarks' => 'PDI seeded',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays($index * 5),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('QualityQRD')) {
            $actions = ['Scrap', 'Return', 'Rework', 'Downgrade'];
            foreach (range(1, 4) as $index) {
                DB::table('QualityQRD')->updateOrInsert(
                    ['rejectionId' => "QRD-SEED-{$index}"],
                    [
                        'productId' => $productIds[$index % $productIds->count()],
                        'item' => null,
                        'qty' => 2 + $index,
                        'action' => $actions[$index - 1],
                        'remarks' => 'QRD seeded',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 4),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }
    }

    private function seedContractors($vendorIds, Carbon $now): array
    {
        $workerIds = [];

        if (Schema::hasTable('ContractorWorker')) {
            foreach (range(1, 5) as $index) {
                DB::table('ContractorWorker')->updateOrInsert(
                    ['workerId' => "CW-SEED-{$index}"],
                    [
                        'vendorId' => $vendorIds[$index % $vendorIds->count()],
                        'workerName' => "Contract Worker {$index}",
                        'skillLevel' => $index % 2 === 0 ? 'Unskilled' : 'Skilled',
                        'aadharNo' => '99001122' . str_pad((string) $index, 4, '0', STR_PAD_LEFT),
                        'isActive' => true,
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 11),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );

                $workerIds[] = DB::table('ContractorWorker')->where('workerId', "CW-SEED-{$index}")->value('id');
            }
        }

        if (Schema::hasTable('ContractorSalaryHead')) {
            foreach ([
                ['role' => 'Fitter', 'dailyRate' => 850, 'overtimeRate' => 120],
                ['role' => 'Welder', 'dailyRate' => 900, 'overtimeRate' => 140],
                ['role' => 'Helper', 'dailyRate' => 550, 'overtimeRate' => 90],
            ] as $row) {
                DB::table('ContractorSalaryHead')->insert([
                    'role' => $row['role'],
                    'dailyRate' => $row['dailyRate'],
                    'overtimeRate' => $row['overtimeRate'],
                    'isActive' => true,
                    'createdBy' => 1,
                    'createdAt' => $now,
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ContractorSalaryStructure') && !empty($workerIds)) {
            foreach ($workerIds as $index => $workerId) {
                DB::table('ContractorSalaryStructure')->insert([
                    'workerId' => $workerId,
                    'role' => $index % 2 === 0 ? 'Fitter' : 'Helper',
                    'applicableDailyRate' => $index % 2 === 0 ? 850 : 550,
                    'overtimeRate' => $index % 2 === 0 ? 120 : 90,
                    'isActive' => true,
                    'createdBy' => 1,
                    'createdAt' => $now,
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ContractorSalarySheet') && !empty($workerIds)) {
            foreach (range(0, 5) as $index) {
                $workerId = $workerIds[$index % count($workerIds)];
                $days = 22 + ($index % 4);
                $ot = 6 + $index;
                $dailyRate = $index % 2 === 0 ? 850 : 550;
                $otRate = $index % 2 === 0 ? 120 : 90;
                DB::table('ContractorSalarySheet')->insert([
                    'workerId' => $workerId,
                    'vendorId' => $vendorIds[$index % $vendorIds->count()],
                    'month' => $now->copy()->subMonths(5 - $index)->format('F'),
                    'year' => (int) $now->copy()->subMonths(5 - $index)->format('Y'),
                    'daysWorked' => $days,
                    'overtimeHours' => $ot,
                    'dailyRate' => $dailyRate,
                    'overtimeRate' => $otRate,
                    'totalPayable' => ($days * $dailyRate) + ($ot * $otRate),
                    'status' => 'Processed',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subMonths(5 - $index),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ContractorAdvance')) {
            foreach (range(1, 4) as $index) {
                DB::table('ContractorAdvance')->insert([
                    'vendorId' => $vendorIds[$index % $vendorIds->count()],
                    'date' => $now->copy()->subDays($index * 9)->toDateString(),
                    'amount' => 5000 + (1500 * $index),
                    'remarks' => 'Contractor advance seeded',
                    'status' => 'Issued',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays($index * 9),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ContractorVoucherPayment') && Schema::hasTable('ContractorSalarySheet')) {
            $sheetIds = DB::table('ContractorSalarySheet')->whereNull('deletedAt')->orderByDesc('id')->limit(4)->pluck('id')->values();
            foreach ($sheetIds as $index => $sheetId) {
                DB::table('ContractorVoucherPayment')->updateOrInsert(
                    ['voucherNo' => 'CVP-SEED-' . ($index + 1)],
                    [
                        'vendorId' => $vendorIds[$index % $vendorIds->count()],
                        'salarySheetId' => $sheetId,
                        'netAmountPaid' => 18000 + ($index * 2000),
                        'tdsDeducted' => 1200 + ($index * 100),
                        'paymentDate' => $now->copy()->subDays(($index + 1) * 8)->toDateString(),
                        'remarks' => 'Voucher payment seeded',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays(($index + 1) * 8),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }

        return array_filter($workerIds);
    }

    private function seedMaintenance(Carbon $now): array
    {
        $toolIds = [];

        if (Schema::hasTable('ToolMaster')) {
            foreach (range(1, 5) as $index) {
                DB::table('ToolMaster')->updateOrInsert(
                    ['assetCode' => "TOOL-SEED-{$index}"],
                    [
                        'toolName' => "Maintenance Tool {$index}",
                        'location' => $index % 2 === 0 ? 'Line 1' : 'Line 2',
                        'maintenanceIntervalDays' => 15 + ($index * 5),
                        'isActive' => true,
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 7),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );

                $toolIds[] = DB::table('ToolMaster')->where('assetCode', "TOOL-SEED-{$index}")->value('id');
            }
        }

        if (Schema::hasTable('ToolMaintenanceChart')) {
            foreach (array_filter($toolIds) as $index => $toolId) {
                DB::table('ToolMaintenanceChart')->insert([
                    'toolId' => $toolId,
                    'scheduledDate' => $now->copy()->addDays(($index + 1) * 3)->toDateString(),
                    'taskList' => 'Clean, inspect, lubricate',
                    'status' => $index % 2 === 0 ? 'Scheduled' : 'Completed',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays(($index + 1) * 5),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ToolCalibrationReport')) {
            foreach (array_filter($toolIds) as $index => $toolId) {
                DB::table('ToolCalibrationReport')->insert([
                    'toolId' => $toolId,
                    'calibrationDate' => $now->copy()->subDays(($index + 1) * 6)->toDateString(),
                    'standardValue' => 100,
                    'actualValue' => 100 - ($index % 3),
                    'result' => $index % 4 === 0 ? 'Fail' : 'Pass',
                    'remarks' => 'Calibration seeded',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays(($index + 1) * 6),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('ToolRectificationMemo')) {
            foreach (array_filter($toolIds) as $index => $toolId) {
                DB::table('ToolRectificationMemo')->updateOrInsert(
                    ['jobId' => 'JOB-SEED-' . ($index + 1)],
                    [
                        'toolId' => $toolId,
                        'issue' => 'Seeded issue ' . ($index + 1),
                        'sparesUsed' => 'Seal kit',
                        'cost' => 900 + ($index * 250),
                        'technician' => 'Tech ' . ($index + 1),
                        'status' => $index % 2 === 0 ? 'Open' : 'Closed',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays(($index + 1) * 4),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }

        return array_filter($toolIds);
    }

    private function seedWarehouse($warehouseId, $productIds, Carbon $now): void
    {
        if (!$warehouseId) {
            return;
        }

        if (Schema::hasTable('WarehouseOpening')) {
            foreach (range(1, 4) as $index) {
                DB::table('WarehouseOpening')->insert([
                    'warehouseId' => $warehouseId,
                    'productId' => $productIds[$index % $productIds->count()],
                    'openingQty' => 50 + (10 * $index),
                    'value' => 8000 + (2000 * $index),
                    'date' => $now->copy()->subMonths($index)->toDateString(),
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subMonths($index),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('DispatchSRV')) {
            foreach (range(1, 4) as $index) {
                DB::table('DispatchSRV')->updateOrInsert(
                    ['srvNo' => 'SRV-SEED-' . $index],
                    [
                        'date' => $now->copy()->subDays($index * 7)->toDateString(),
                        'partyName' => 'Seed Party ' . $index,
                        'productId' => $productIds[$index % $productIds->count()],
                        'qty' => 5 + $index,
                        'returnExpected' => $index % 2 === 0,
                        'returnExpectedDate' => $index % 2 === 0 ? $now->copy()->addDays(10 + $index)->toDateString() : null,
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 7),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }

        if (Schema::hasTable('WarehouseStockTransfer')) {
            foreach (range(1, 4) as $index) {
                DB::table('WarehouseStockTransfer')->updateOrInsert(
                    ['transferId' => 'WST-SEED-' . $index],
                    [
                        'fromWarehouseId' => $warehouseId,
                        'toWarehouseId' => $warehouseId,
                        'productId' => $productIds[$index % $productIds->count()],
                        'qty' => 4 + $index,
                        'status' => $index % 2 === 0 ? 'Pending' : 'Transferred',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 6),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }

        if (Schema::hasTable('WarehouseMaterialReceipt')) {
            foreach (range(1, 4) as $index) {
                DB::table('WarehouseMaterialReceipt')->updateOrInsert(
                    ['receiptId' => 'WMR-SEED-' . $index],
                    [
                        'sourceDocRef' => 'WST-SEED-' . $index,
                        'warehouseId' => $warehouseId,
                        'productId' => $productIds[$index % $productIds->count()],
                        'qtyReceived' => 6 + $index,
                        'receiptDate' => $now->copy()->subDays($index * 5)->toDateString(),
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays($index * 5),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }
    }

    private function seedAssets($employeeId, Carbon $now): array
    {
        $assetIds = [];

        if (Schema::hasTable('FixedAssetMaster')) {
            $groups = ['IT', 'Plant', 'Furniture'];
            foreach (range(1, 6) as $index) {
                DB::table('FixedAssetMaster')->updateOrInsert(
                    ['assetTag' => 'AST-SEED-' . $index],
                    [
                        'name' => 'Seed Asset ' . $index,
                        'assetGroup' => $groups[$index % count($groups)],
                        'purchaseDate' => $now->copy()->subMonths(18 + ($index * 2))->toDateString(),
                        'value' => 25000 + ($index * 8000),
                        'currentValue' => 21000 + ($index * 6000),
                        'depreciationRate' => 10 + $index,
                        'status' => $index % 5 === 0 ? 'Sold' : 'Active',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subMonths(18 + ($index * 2)),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );

                $assetIds[] = DB::table('FixedAssetMaster')->where('assetTag', 'AST-SEED-' . $index)->value('id');
            }
        }

        if (Schema::hasTable('AssetAdditionMemo')) {
            foreach (array_filter($assetIds) as $index => $assetId) {
                DB::table('AssetAdditionMemo')->insert([
                    'assetId' => $assetId,
                    'invoiceRef' => 'INV-AS-SEED-' . ($index + 1),
                    'installationDate' => $now->copy()->subMonths($index + 4)->toDateString(),
                    'depreciationRate' => 12 + $index,
                    'remarks' => 'Asset addition seeded',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subMonths($index + 4),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('AssetAllocationMaster')) {
            foreach (array_filter($assetIds) as $index => $assetId) {
                DB::table('AssetAllocationMaster')->insert([
                    'assetId' => $assetId,
                    'employeeId' => $employeeId,
                    'employeeName' => 'Seed Employee',
                    'department' => $index % 2 === 0 ? 'Production' : 'Quality',
                    'dateAssigned' => $now->copy()->subDays(($index + 1) * 11)->toDateString(),
                    'status' => 'Allocated',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subDays(($index + 1) * 11),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('AssetSaleMemo')) {
            foreach (array_filter($assetIds) as $index => $assetId) {
                if ($index % 3 !== 0) {
                    continue;
                }
                DB::table('AssetSaleMemo')->insert([
                    'assetId' => $assetId,
                    'saleDate' => $now->copy()->subMonths($index + 1)->toDateString(),
                    'saleValue' => 18000 + ($index * 3000),
                    'bookValue' => 15000 + ($index * 2500),
                    'remarks' => 'Asset sale seeded',
                    'createdBy' => 1,
                    'createdAt' => $now->copy()->subMonths($index + 1),
                    'updatedAt' => $now,
                    'deletedAt' => null,
                ]);
            }
        }

        if (Schema::hasTable('AssetDepreciationVoucher')) {
            $years = [$now->year - 2, $now->year - 1, $now->year];
            foreach ($years as $yearIndex => $year) {
                foreach (array_slice(array_filter($assetIds), 0, 4) as $assetId) {
                    DB::table('AssetDepreciationVoucher')->insert([
                        'year' => $year,
                        'assetId' => $assetId,
                        'openingBalance' => 50000 - ($yearIndex * 4000),
                        'depreciationAmount' => 5000 + ($yearIndex * 800),
                        'closingBalance' => 45000 - ($yearIndex * 3200),
                        'remarks' => 'Depreciation seeded',
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subMonths(($yearIndex + 1) * 3),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]);
                }
            }
        }

        return array_filter($assetIds);
    }

    private function seedLogistics(Carbon $now): void
    {
        $transporterIds = [];

        if (Schema::hasTable('Transporter')) {
            $transporters = [
                ['name' => 'Swift Roadlines', 'ownerName' => 'Kiran Patel', 'mobile' => '9876500011', 'gstin' => '24AAECM1111A1Z5'],
                ['name' => 'Metro Cargo Movers', 'ownerName' => 'Ramesh Singh', 'mobile' => '9876500022', 'gstin' => '24AAECM2222A1Z6'],
                ['name' => 'Northline Freight', 'ownerName' => 'Iqbal Khan', 'mobile' => '9876500033', 'gstin' => '24AAECM3333A1Z7'],
                ['name' => 'Prime Logistic Hub', 'ownerName' => 'Dinesh Nair', 'mobile' => '9876500044', 'gstin' => '24AAECM4444A1Z8'],
            ];

            foreach ($transporters as $row) {
                DB::table('Transporter')->updateOrInsert(
                    ['name' => $row['name']],
                    [
                        'ownerName' => $row['ownerName'],
                        'mobile' => $row['mobile'],
                        'gstin' => $row['gstin'],
                        'isActive' => true,
                        'createdBy' => 1,
                        'createdAt' => $now->copy()->subDays(30),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );

                $transporterId = DB::table('Transporter')->where('name', $row['name'])->value('id');
                if ($transporterId) {
                    $transporterIds[] = $transporterId;
                }
            }
        }

        if (Schema::hasTable('DispatchAdvice') && Schema::hasTable('SaleOrder') && !empty($transporterIds)) {
            $saleOrders = DB::table('SaleOrder')
                ->whereNull('deletedAt')
                ->orderBy('id')
                ->limit(6)
                ->get(['id']);

            if ($saleOrders->isEmpty()) {
                return;
            }

            $statuses = ['Pending', 'In Transit', 'Delivered', 'In Transit', 'Delivered', 'Pending'];

            foreach ($saleOrders as $index => $order) {
                DB::table('DispatchAdvice')->updateOrInsert(
                    ['dispatchNo' => 'LOG-DISP-' . ($index + 1)],
                    [
                        'saleOrderId' => $order->id,
                        'transporterId' => $transporterIds[$index % count($transporterIds)],
                        'vehicleNo' => 'GJ01TR' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                        'driverName' => 'Driver ' . ($index + 1),
                        'dispatchDate' => $now->copy()->subDays(($index + 1) * 3),
                        'status' => $statuses[$index % count($statuses)],
                        'isActive' => true,
                        'createdBy' => 1,
                        'updatedBy' => 1,
                        'createdAt' => $now->copy()->subDays(($index + 1) * 3),
                        'updatedAt' => $now,
                        'deletedAt' => null,
                    ]
                );
            }
        }
    }
}
