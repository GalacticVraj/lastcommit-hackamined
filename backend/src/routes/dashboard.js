const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const [customers, invoices, revenue, vendors, products, employees, overdue] = await Promise.all([
            prisma.customer.count({ where: { isActive: true } }),
            prisma.invoice.count(),
            prisma.invoice.aggregate({ _sum: { grandTotal: true } }),
            prisma.vendor.count({ where: { isActive: true } }),
            prisma.product.count({ where: { isActive: true } }),
            prisma.employee.count({ where: { isActive: true } }),
            prisma.invoice.count({ where: { status: 'Overdue' } })
        ]);

        return successResponse(res, {
            stats: {
                totalCustomers: customers,
                totalInvoices: invoices,
                totalRevenue: revenue._sum.grandTotal || 0,
                totalVendors: vendors,
                totalProducts: products,
                totalEmployees: employees,
                overdueInvoices: overdue
            }
        });
    } catch (e) { next(e); }
});

module.exports = router;
