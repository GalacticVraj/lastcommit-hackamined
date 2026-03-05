const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const now = new Date();
        const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = startThisMonth;

        // primary metrics
        const [salesThisAgg, salesLastAgg, outstandingAgg, openPOs, activeRCs, orderStatusCounts, monthlySalesData, topCustGroups, recentActs] = await Promise.all([
            prisma.invoice.aggregate({
                where: { invoiceDate: { gte: startThisMonth, lt: startNextMonth } },
                _sum: { grandTotal: true }
            }),
            prisma.invoice.aggregate({
                where: { invoiceDate: { gte: startLastMonth, lt: endLastMonth } },
                _sum: { grandTotal: true }
            }),
            prisma.invoice.aggregate({
                where: {
                    dueDate: { lt: now },
                    status: { in: ['Unpaid', 'Partial', 'Overdue'] }
                },
                _sum: { grandTotal: true }
            }),
            prisma.purchaseOrder.count({ where: { status: { not: 'Closed' } } }),
            prisma.productionRouteCard.count({ where: { status: { not: 'Closed' } } }),
            prisma.saleOrder.groupBy({ by: ['status'], _count: { status: true } }),
            // monthly sales for last 6 months will be built later sequentially
            Promise.resolve(null),
            prisma.invoice.groupBy({
                by: ['customerId'],
                _sum: { grandTotal: true },
                where: { invoiceDate: { gte: startThisMonth, lt: startNextMonth } },
                orderBy: { _sum: { grandTotal: 'desc' } },
                take: 5
            }),
            prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } })
        ]);

        // build monthly sales array
        const monthlySales = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const agg = await prisma.invoice.aggregate({
                where: { invoiceDate: { gte: d, lt: next } },
                _sum: { grandTotal: true }
            });
            monthlySales.push({
                month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                total: agg._sum.grandTotal || 0
            });
        }

        // map top customers with names
        const topCustomers = [];
        for (const grp of topCustGroups) {
            const cust = await prisma.customer.findUnique({ where: { id: grp.customerId } });
            topCustomers.push({ id: grp.customerId, name: cust?.name || 'Unknown', amount: grp._sum.grandTotal || 0 });
        }

        const recentActivities = recentActs.map(a => ({
            id: a.id,
            userName: a.user?.name,
            action: a.action,
            entity: a.entity,
            entityId: a.entityId,
            createdAt: a.createdAt
        }));

        const salesThis = salesThisAgg._sum.grandTotal || 0;
        const salesLast = salesLastAgg._sum.grandTotal || 0;
        const salesChange = salesLast ? ((salesThis - salesLast) / salesLast) * 100 : null;

        return successResponse(res, {
            salesThisMonth: { value: salesThis, prevValue: salesLast, changePct: salesChange },
            outstandingReceivables: { value: outstandingAgg._sum.grandTotal || 0 },
            openPurchaseOrders: { value: openPOs },
            productionOrdersActive: { value: activeRCs },
            monthlySales,
            saleOrderStatus: orderStatusCounts.map(o => ({ status: o.status, count: o._count.status })),
            topCustomers,
            recentActivities
        });
    } catch (e) { next(e); }
});

module.exports = router;
