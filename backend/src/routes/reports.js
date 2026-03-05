const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/responseHelper');

router.use(authenticate);

// Reports stub — each report returns relevant data for the ReportViewer component
router.get('/:type', async (req, res, next) => {
    try {
        const { type } = req.params;
        const { from, to } = req.query;
        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);

        let data = [];
        switch (type) {
            case 'sales-register':
                data = await prisma.invoice.findMany({ where: { createdAt: Object.keys(dateFilter).length ? dateFilter : undefined }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
                break;
            case 'purchase-register':
                data = await prisma.purchaseBill.findMany({ where: { createdAt: Object.keys(dateFilter).length ? dateFilter : undefined }, include: { vendor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
                break;
            case 'stock-ledger':
                data = await prisma.product.findMany({ where: { isActive: true }, select: { code: true, name: true, currentStock: true, blockedStock: true, lastPurchasePrice: true, unit: true } });
                break;
            case 'outstanding-receivables':
                data = await prisma.invoice.findMany({ where: { status: { in: ['Unpaid', 'Partial', 'Overdue'] } }, include: { customer: { select: { name: true } } }, orderBy: { dueDate: 'asc' } });
                break;
            case 'outstanding-payables':
                data = await prisma.purchaseBill.findMany({ where: { status: 'Unpaid' }, include: { vendor: { select: { name: true } } } });
                break;
            case 'daily-production':
                data = await prisma.productionReport.findMany({ where: { reportDate: Object.keys(dateFilter).length ? dateFilter : undefined }, include: { product: { select: { name: true } } }, orderBy: { reportDate: 'desc' } });
                break;
            case 'material-consumption':
                data = await prisma.materialIssueItem.findMany({ include: { product: { select: { name: true, unit: true } } }, take: 100 });
                break;
            case 'gst-summary':
                data = await prisma.invoice.findMany({ where: { createdAt: Object.keys(dateFilter).length ? dateFilter : undefined }, select: { invoiceNo: true, taxableValue: true, cgstAmount: true, sgstAmount: true, igstAmount: true, grandTotal: true } });
                break;
            case 'payroll-summary':
                data = await prisma.employeeSalarySheet.findMany({ include: { employee: { select: { name: true, empCode: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
                break;
            case 'collection-efficiency':
                const paid = await prisma.invoice.count({ where: { status: 'Paid' } });
                const total = await prisma.invoice.count();
                data = { paidCount: paid, totalCount: total, efficiency: total > 0 ? +((paid / total) * 100).toFixed(2) : 0 };
                break;
            case 'vendor-performance':
                data = await prisma.gRN.findMany({ include: { vendor: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
                break;
            case 'inventory-valuation':
                data = await prisma.product.findMany({ where: { isActive: true }, select: { code: true, name: true, currentStock: true, lastPurchasePrice: true } });
                data = data.map(p => ({ ...p, valuation: +(p.currentStock * p.lastPurchasePrice).toFixed(2) }));
                break;
            case 'job-work-summary':
                data = await prisma.jobOrder.findMany({ include: { bills: true }, orderBy: { createdAt: 'desc' } });
                break;
            case 'asset-depreciation':
                data = await prisma.assetDepreciation.findMany({ include: { asset: { select: { name: true, assetTag: true } } }, orderBy: { year: 'desc' } });
                break;
            case 'pnl':
                const revenue = await prisma.invoice.aggregate({ _sum: { grandTotal: true } });
                const expenses = await prisma.purchaseBill.aggregate({ _sum: { totalAmount: true } });
                const payroll = await prisma.employeeSalarySheet.aggregate({ _sum: { netPay: true } });
                data = { revenue: revenue._sum.grandTotal || 0, cogs: expenses._sum.totalAmount || 0, payroll: payroll._sum.netPay || 0, profit: (revenue._sum.grandTotal || 0) - (expenses._sum.totalAmount || 0) - (payroll._sum.netPay || 0) };
                break;
            case 'balance-sheet':
                const assetTotal = await prisma.asset.aggregate({ where: { isActive: true }, _sum: { currentValue: true } });
                data = { totalAssets: assetTotal._sum.currentValue || 0 };
                break;
            case 'bank-reconciliation':
                data = await prisma.bankReconciliation.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
                break;
            case 'tds-tcs':
                const tds = await prisma.tDSDetail.findMany();
                const tcs = await prisma.tCSDetail.findMany();
                data = { tds, tcs };
                break;
            case 'simulation-result':
                data = await prisma.simulationRun.findMany({ include: { inputs: true, results: true }, orderBy: { createdAt: 'desc' }, take: 10 });
                break;
            case 'communication-log':
                data = await prisma.communicationLog.findMany({ include: { invoice: { select: { invoiceNo: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
                break;
            default:
                return res.status(404).json({ success: false, message: 'Report type not found' });
        }
        return successResponse(res, data, `${type} report generated`);
    } catch (e) { next(e); }
});

module.exports = router;
