const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

// Journal Vouchers
router.get('/vouchers', checkPermission('finance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.journalVoucher.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma.journalVoucher.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/vouchers', checkPermission('finance.voucher.create'), async (req, res, next) => {
    try {
        const voucherNo = await generateDocNumber('JV', 'JV');
        const v = await prisma.journalVoucher.create({ data: { ...req.body, voucherNo, createdBy: req.user.id } });
        return successResponse(res, v, 'Voucher created', 201);
    } catch (e) { next(e); }
});

// Bank Reconciliation
router.get('/bank-reconciliation', checkPermission('finance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.bankReconciliation.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { items: true } }), prisma.bankReconciliation.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/bank-reconciliation', checkPermission('finance.reconciliation.create'), async (req, res, next) => {
    try {
        const { bankAccount, statementDate, systemBalance, bankBalance, items } = req.body;
        const unreconciledAmt = Math.abs(systemBalance - bankBalance);
        const rec = await prisma.bankReconciliation.create({ data: { bankAccount, statementDate: new Date(statementDate), systemBalance, bankBalance, unreconciledAmt, createdBy: req.user.id, items: { create: (items || []).map(i => ({ ...i, transactionDate: new Date(i.transactionDate) })) } }, include: { items: true } });
        return successResponse(res, rec, 'Bank Reconciliation created', 201);
    } catch (e) { next(e); }
});

// Credit Card Statements
router.get('/credit-card', checkPermission('finance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.creditCardStatement.findMany({ skip, take: perPage, orderBy: { transactionDate: 'desc' } }), prisma.creditCardStatement.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/credit-card', checkPermission('finance.cc.create'), async (req, res, next) => {
    try {
        const cc = await prisma.creditCardStatement.create({ data: { ...req.body, transactionDate: new Date(req.body.transactionDate), createdBy: req.user.id } });
        return successResponse(res, cc, 'Credit Card entry created', 201);
    } catch (e) { next(e); }
});

// Dashboard
router.get('/dashboard', checkPermission('finance.view'), async (req, res, next) => {
    try {
        const [totalVouchers, totalReconciliations, totalPayments, totalReceipts] = await Promise.all([
            prisma.journalVoucher.count(), prisma.bankReconciliation.count(),
            prisma.journalVoucher.count({ where: { voucherType: 'Payment' } }),
            prisma.journalVoucher.count({ where: { voucherType: 'Receipt' } })
        ]);
        return successResponse(res, { stats: { totalVouchers, totalReconciliations, totalPayments, totalReceipts } });
    } catch (e) { next(e); }
});

module.exports = router;
