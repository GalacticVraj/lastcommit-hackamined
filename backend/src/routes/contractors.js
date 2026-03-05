const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/workers', checkPermission('contractors.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.contractorWorker.findMany({ skip, take: perPage, orderBy: { workerName: 'asc' } }), prisma.contractorWorker.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/workers', checkPermission('contractors.worker.create'), async (req, res, next) => {
    try { const w = await prisma.contractorWorker.create({ data: { ...req.body, createdBy: req.user.id } }); return successResponse(res, w, 'Worker registered', 201); } catch (e) { next(e); }
});

router.get('/salary-heads', checkPermission('contractors.view'), async (req, res, next) => {
    try { const data = await prisma.contractorSalaryHead.findMany(); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/salary-heads', checkPermission('contractors.salary.create'), async (req, res, next) => {
    try { const h = await prisma.contractorSalaryHead.create({ data: req.body }); return successResponse(res, h, 'Salary Head created', 201); } catch (e) { next(e); }
});

router.get('/salary-sheets', checkPermission('contractors.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.contractorSalarySheet.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { worker: { select: { workerName: true } } } }), prisma.contractorSalarySheet.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/salary-sheets', checkPermission('contractors.salary.create'), async (req, res, next) => {
    try {
        const { workerId, month, year, daysWorked, otHours, dailyRate, otRate } = req.body;
        const gross = (daysWorked * dailyRate) + (otHours * otRate);
        const tds = +(gross * 0.02).toFixed(2); // TDS 2%
        const net = +(gross - tds).toFixed(2);
        const sheet = await prisma.contractorSalarySheet.create({ data: { workerId, month, year, daysWorked, otHours, dailyRate, otRate, grossAmount: +gross.toFixed(2), tdsDeducted: tds, netPayable: net, createdBy: req.user.id } });
        return successResponse(res, sheet, 'Contractor Salary Sheet created', 201);
    } catch (e) { next(e); }
});

router.post('/advance', checkPermission('contractors.advance.create'), async (req, res, next) => {
    try { const a = await prisma.contractorAdvanceMemo.create({ data: { ...req.body, createdBy: req.user.id } }); return successResponse(res, a, 'Advance Memo created', 201); } catch (e) { next(e); }
});

router.get('/dashboard', checkPermission('contractors.view'), async (req, res, next) => {
    try {
        const [totalWorkers, totalPayroll] = await Promise.all([
            prisma.contractorWorker.count({ where: { isActive: true } }),
            prisma.contractorSalarySheet.aggregate({ _sum: { netPayable: true } })
        ]);
        return successResponse(res, { stats: { totalWorkers, totalPayroll: totalPayroll._sum.netPayable || 0 } });
    } catch (e) { next(e); }
});

module.exports = router;
