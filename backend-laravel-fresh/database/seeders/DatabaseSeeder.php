<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\UserRole;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ── 1. Permissions ──
        $modules = [
            ['module' => 'sales', 'actions' => ['view', 'customer.create', 'customer.edit', 'customer.delete', 'inquiry.create', 'inquiry.edit', 'quotation.create', 'quotation.edit', 'so.create', 'so.edit', 'dispatch.create', 'invoice.create', 'receipt.create']],
            ['module' => 'purchase', 'actions' => ['view', 'vendor.create', 'vendor.edit', 'vendor.delete', 'indent.create', 'po.create', 'grn.create', 'iqc.create', 'receipt.create', 'bill.create', 'payment.create']],
            ['module' => 'production', 'actions' => ['view', 'product.create', 'product.edit', 'bom.create', 'routecard.create', 'routecard.edit', 'issue.create', 'transfer.create', 'report.create', 'job.create', 'challan.create', 'bill.create']],
            ['module' => 'simulation', 'actions' => ['view', 'run']],
            ['module' => 'finance', 'actions' => ['view', 'voucher.create', 'reconciliation.create', 'cc.create']],
            ['module' => 'hr', 'actions' => ['view', 'employee.create', 'employee.edit', 'salary.create', 'advance.create']],
            ['module' => 'quality', 'actions' => ['view', 'iqc.create', 'mts.create', 'pqc.create', 'pdi.create', 'qrd.create']],
            ['module' => 'warehouse', 'actions' => ['view', 'create', 'transfer.create', 'srv.create']],
            ['module' => 'statutory', 'actions' => ['view', 'gst.create', 'tds.create', 'tcs.create', 'cheque.create', 'challan.create']],
            ['module' => 'logistics', 'actions' => ['view', 'transporter.create', 'order.create', 'bill.create']],
            ['module' => 'maintenance', 'actions' => ['view', 'tool.create', 'chart.create', 'calibration.create', 'rectification.create']],
            ['module' => 'assets', 'actions' => ['view', 'create', 'addition.create', 'allocation.create', 'sale.create', 'depreciation.create']],
        ];

        // Add wildcard
        Permission::firstOrCreate(
            ['module' => '*', 'action' => '*'],
            ['description' => 'Super Admin - All permissions']
        );

        foreach ($modules as $mod) {
            foreach ($mod['actions'] as $action) {
                Permission::firstOrCreate(
                    ['module' => $mod['module'], 'action' => $action],
                    ['description' => $mod['module'] . '.' . $action]
                );
            }
        }

        // ── 2. Roles ──
        $superAdminRole = Role::firstOrCreate(
            ['name' => 'Super Admin'],
            ['description' => 'Full access to all modules']
        );

        $salesRole = Role::firstOrCreate(
            ['name' => 'Sales Manager'],
            ['description' => 'Sales module access']
        );

        // Assign all permissions to Super Admin
        $allPerms = Permission::all();
        foreach ($allPerms as $perm) {
            RolePermission::firstOrCreate([
                'roleId' => $superAdminRole->id,
                'permissionId' => $perm->id
            ]);
        }

        // Assign sales permissions to Sales Manager
        $salesPerms = Permission::where('module', 'sales')->get();
        foreach ($salesPerms as $perm) {
            RolePermission::firstOrCreate([
                'roleId' => $salesRole->id,
                'permissionId' => $perm->id
            ]);
        }

        // ── 3. Users ──
        $hashedPw = Hash::make('password');

        $admin = User::firstOrCreate(
            ['email' => 'admin@erp.com'],
            ['name' => 'Super Admin', 'password' => $hashedPw, 'isActive' => true]
        );
        UserRole::firstOrCreate([
            'userId' => $admin->id,
            'roleId' => $superAdminRole->id
        ]);

        $salesUser = User::firstOrCreate(
            ['email' => 'sales@erp.com'],
            ['name' => 'Sales User', 'password' => $hashedPw, 'isActive' => true]
        );
        UserRole::firstOrCreate([
            'userId' => $salesUser->id,
            'roleId' => $salesRole->id
        ]);

        echo "✅ Seeded: admin@erp.com / password, sales@erp.com / password\n";

        // ── 4. Synthetic Test Data ──
        $this->call(SyntheticDataSeeder::class);
    }
}
