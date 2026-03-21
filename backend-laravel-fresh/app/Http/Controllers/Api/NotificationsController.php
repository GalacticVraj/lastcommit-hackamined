<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\GRN;
use App\Models\PurchaseBill;
use App\Models\EmployeeAdvance;
use App\Models\JobOrder;

class NotificationsController extends Controller
{
    /**
     * Generate dynamic notifications from live DB state + notification_flags table.
     */
    public function index(Request $request)
    {
        $notifications = [];
        $nextId = 1; // synthetic id for DB-generated notifications

        // ── 1. Overdue Invoices ──────────────────────────────────────────────
        try {
            $overdueInvoices = Invoice::whereNull('deletedAt')
                ->whereIn('status', ['Unpaid', 'Partial', 'Overdue'])
                ->where('dueDate', '<', now())
                ->select('id', 'invoiceNumber', 'dueDate', 'grandTotal')
                ->orderBy('dueDate', 'asc')
                ->limit(5)
                ->get();

            foreach ($overdueInvoices as $inv) {
                $num = $inv->invoiceNumber ?? ('#' . $inv->id);
                $daysAgo = Carbon::parse($inv->dueDate)->diffForHumans();
                $notifications[] = [
                    'id'     => 'db_invoice_' . $inv->id,
                    'title'  => "Invoice {$num} overdue",
                    'time'   => "Due {$daysAgo}",
                    'type'   => 'warning',
                    'link'   => '/sales?tab=invoices',
                    'read'   => false,
                    'source' => 'db',
                ];
                $nextId++;
            }
        } catch (\Exception $e) {
            // Table may not exist yet, skip gracefully
        }

        // ── 2. Pending Purchase Orders ────────────────────────────────────────
        try {
            $pendingPOs = PurchaseOrder::whereNull('deletedAt')
                ->where('status', 'Pending')
                ->select('id', 'poNumber', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($pendingPOs as $po) {
                $num = $po->poNumber ?? ('#' . $po->id);
                $notifications[] = [
                    'id'     => 'db_po_' . $po->id,
                    'title'  => "PO {$num} awaiting approval",
                    'time'   => Carbon::parse($po->created_at)->diffForHumans(),
                    'type'   => 'warning',
                    'link'   => '/purchase?tab=orders',
                    'read'   => false,
                    'source' => 'db',
                ];
            }
        } catch (\Exception $e) {}

        // ── 3. Unpaid Purchase Bills ──────────────────────────────────────────
        try {
            $unpaidBills = PurchaseBill::whereNull('deletedAt')
                ->where('status', 'Unpaid')
                ->select('id', 'billNumber', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($unpaidBills as $bill) {
                $num = $bill->billNumber ?? ('#' . $bill->id);
                $notifications[] = [
                    'id'     => 'db_bill_' . $bill->id,
                    'title'  => "Purchase bill {$num} unpaid",
                    'time'   => Carbon::parse($bill->created_at)->diffForHumans(),
                    'type'   => 'info',
                    'link'   => '/purchase?tab=bills',
                    'read'   => false,
                    'source' => 'db',
                ];
            }
        } catch (\Exception $e) {}

        // ── 4. GRNs Pending IQC ───────────────────────────────────────────────
        try {
            $pendingGRNs = GRN::whereNull('deletedAt')
                ->where('status', 'Pending')
                ->select('id', 'grnNumber', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($pendingGRNs as $grn) {
                $num = $grn->grnNumber ?? ('#' . $grn->id);
                $notifications[] = [
                    'id'     => 'db_grn_' . $grn->id,
                    'title'  => "GRN {$num} pending IQC",
                    'time'   => Carbon::parse($grn->created_at)->diffForHumans(),
                    'type'   => 'info',
                    'link'   => '/quality?tab=iqc',
                    'read'   => false,
                    'source' => 'db',
                ];
            }
        } catch (\Exception $e) {}

        // ── 5. Pending Employee Advances ──────────────────────────────────────
        try {
            $pendingAdvances = EmployeeAdvance::where('status', 'Pending')
                ->select('id', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($pendingAdvances as $adv) {
                $notifications[] = [
                    'id'     => 'db_advance_' . $adv->id,
                    'title'  => 'Employee advance request pending approval',
                    'time'   => Carbon::parse($adv->created_at)->diffForHumans(),
                    'type'   => 'info',
                    'link'   => '/hr?tab=advances',
                    'read'   => false,
                    'source' => 'db',
                ];
            }
        } catch (\Exception $e) {}

        // ── 6. Pending Job Orders ─────────────────────────────────────────────
        try {
            $pendingJOs = JobOrder::whereNull('deletedAt')
                ->where('status', 'Pending')
                ->select('id', 'jobOrderNumber', 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($pendingJOs as $jo) {
                $num = $jo->jobOrderNumber ?? ('#' . $jo->id);
                $notifications[] = [
                    'id'     => 'db_jo_' . $jo->id,
                    'title'  => "Job order {$num} pending",
                    'time'   => Carbon::parse($jo->created_at)->diffForHumans(),
                    'type'   => 'info',
                    'link'   => '/production?tab=job-orders',
                    'read'   => false,
                    'source' => 'db',
                ];
            }
        } catch (\Exception $e) {}

        // ── 7. Low Stock (Warehouse) ──────────────────────────────────────────
        try {
            if (Schema::hasTable('WarehouseStock') && Schema::hasColumn('WarehouseStock', 'quantity')) {
                $lowStock = DB::table('WarehouseStock')
                    ->where('quantity', '<', 10)
                    ->where('quantity', '>', 0)
                    ->join('products_master', 'WarehouseStock.productId', '=', 'products_master.id')
                    ->select('products_master.name', 'WarehouseStock.quantity', 'WarehouseStock.productId')
                    ->limit(3)
                    ->get();

                foreach ($lowStock as $row) {
                    $pname = $row->name ?? ('Product #' . $row->productId);
                    $notifications[] = [
                        'id'     => 'db_stock_' . $row->productId,
                        'title'  => "Low stock alert: {$pname} (qty: {$row->quantity})",
                        'time'   => 'Real-time',
                        'type'   => 'warning',
                        'link'   => '/warehouse?tab=dashboard',
                        'read'   => false,
                        'source' => 'db',
                    ];
                }
            }
        } catch (\Exception $e) {}

        // ── 8. notification_flags table (user-specific alerts) ────────────────
        try {
            if (Schema::hasTable('notification_flags')) {
                $userId = $request->user()?->id;
                $flags = DB::table('notification_flags')
                    ->where('user_id', $userId)
                    ->where('is_seen', false)
                    ->orderBy('created_at', 'desc')
                    ->limit(20)
                    ->get();

                foreach ($flags as $flag) {
                    $type = match ($flag->severity) {
                        'critical' => 'warning',
                        'warning'  => 'warning',
                        default    => 'info',
                    };
                    $notifications[] = [
                        'id'     => 'flag_' . $flag->id,
                        'title'  => $flag->message,
                        'time'   => Carbon::parse($flag->created_at)->diffForHumans(),
                        'type'   => $type,
                        'link'   => null,
                        'read'   => false,
                        'source' => 'flag',
                        'flag_id'=> $flag->id,
                    ];
                }
            }
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'data'    => $notifications,
            'count'   => count($notifications),
            'unread'  => count(array_filter($notifications, fn($n) => !$n['read'])),
        ]);
    }

    /**
     * Mark a notification as read.
     * For flag-sourced: sets is_seen = true.
     * For db-generated: no-op (returns 200 OK).
     */
    public function markRead(Request $request, string $id)
    {
        if (str_starts_with($id, 'flag_')) {
            $flagId = (int) substr($id, 5);
            DB::table('notification_flags')
                ->where('id', $flagId)
                ->where('user_id', $request->user()?->id)
                ->update(['is_seen' => true]);
        }
        // DB-generated notifications don't have persistent read state
        return response()->json(['success' => true]);
    }

    /**
     * Mark all flag-sourced notifications as read for the current user.
     */
    public function markAllRead(Request $request)
    {
        try {
            if (Schema::hasTable('notification_flags')) {
                DB::table('notification_flags')
                    ->where('user_id', $request->user()?->id)
                    ->update(['is_seen' => true]);
            }
        } catch (\Exception $e) {}

        return response()->json(['success' => true]);
    }

    /**
     * Dismiss (delete) a flag-sourced notification.
     * DB-generated notifications are real-time and cannot be permanently dismissed.
     */
    public function dismiss(Request $request, string $id)
    {
        if (str_starts_with($id, 'flag_')) {
            $flagId = (int) substr($id, 5);
            DB::table('notification_flags')
                ->where('id', $flagId)
                ->where('user_id', $request->user()?->id)
                ->delete();
        }
        // For db-generated notifications we just return 200 OK;
        // the frontend will optimistically remove them from state.
        return response()->json(['success' => true]);
    }
}
