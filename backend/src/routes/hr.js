const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

// Employees
router.get('/employees', checkPermission('hr.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip, search } = parseListQuery(req.query);
        const where = { deletedAt: null };
        if (search) where.name = { contains: search };
        const [data, total] = await Promise.all([prisma.employee.findMany({ where, skip, take: perPage, orderBy: { name: 'asc' } }), prisma.employee.count({ where })]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/employees', checkPermission('hr.employee.create'), async (req, res, next) => {
    try {
        const emp = await prisma.employee.create({ data: { ...req.body, joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : new Date(), createdBy: req.user.id } });
        return successResponse(res, emp, 'Employee created', 201);
    } catch (e) { next(e); }
});

router.get('/employees/:id', checkPermission('hr.view'), async (req, res, next) => {
    try {
        const emp = await prisma.employee.findUnique({ where: { id: parseInt(req.params.id) }, include: { salaryStructures: true, salarySheets: { take: 12, orderBy: { createdAt: 'desc' } }, advanceMemos: true } });
        // attendance summary currently not tracked; return placeholder values
        emp.attendanceSummary = { presentDays: 0, absentDays: 0, leaves: 0 };
        return successResponse(res, emp);
    } catch (e) { next(e); }
});

router.put('/employees/:id', checkPermission('hr.employee.edit'), async (req, res, next) => {
    try {
        const emp = await prisma.employee.update({ where: { id: parseInt(req.params.id) }, data: { ...req.body, updatedBy: req.user.id } });
        return successResponse(res, emp, 'Employee updated');
    } catch (e) { next(e); }
});

// Salary Heads
router.get('/salary-heads', checkPermission('hr.view'), async (req, res, next) => {
    try {
        const heads = await prisma.salaryHead.findMany({ orderBy: { name: 'asc' } });
        return successResponse(res, heads);
    } catch (e) { next(e); }
});

router.post('/salary-heads', checkPermission('hr.salary.create'), async (req, res, next) => {
    try {
        const head = await prisma.salaryHead.create({ data: req.body });
        return successResponse(res, head, 'Salary Head created', 201);
    } catch (e) { next(e); }
});

// Salary Structure
router.post('/salary-structure', checkPermission('hr.salary.create'), async (req, res, next) => {
    try {
        const ss = await prisma.employeeSalaryStructure.create({ data: { ...req.body, effectiveDate: new Date(req.body.effectiveDate), createdBy: req.user.id } });
        return successResponse(res, ss, 'Salary Structure assigned', 201);
    } catch (e) { next(e); }
});

// Salary Sheet Generation
router.post('/salary-sheet/generate', checkPermission('hr.salary.create'), async (req, res, next) => {
    try {
        const { month, year } = req.body;
        const employees = await prisma.employee.findMany({ where: { isActive: true, deletedAt: null }, include: { salaryStructures: { where: { isActive: true }, take: 1, orderBy: { effectiveDate: 'desc' } }, advanceMemos: { where: { isRecovered: false } } } });

        const sheets = [];
        for (const emp of employees) {
            const ss = emp.salaryStructures[0];
            if (!ss) continue;
            const gross = ss.basic + ss.hra + ss.da + ss.allowances;
            const pf = gross * ss.pfPercent / 100;
            const esi = gross * ss.esiPercent / 100;
            const advanceRecovery = emp.advanceMemos.reduce((sum, m) => sum + m.amount, 0);
            const net = gross - pf - esi - advanceRecovery;

            const sheet = await prisma.employeeSalarySheet.create({
                data: { employeeId: emp.id, month, year, totalDays: 30, presentDays: req.body.presentDays || 26, grossSalary: +gross.toFixed(2), pfDeduction: +pf.toFixed(2), esiDeduction: +esi.toFixed(2), advanceRecovery: +advanceRecovery.toFixed(2), netPay: +net.toFixed(2), createdBy: req.user.id }
            });
            sheets.push(sheet);

            // Mark advances as recovered
            for (const adv of emp.advanceMemos) {
                await prisma.employeeAdvanceMemo.update({ where: { id: adv.id }, data: { isRecovered: true } });
            }
        }
        return successResponse(res, sheets, `Generated ${sheets.length} salary sheets`, 201);
    } catch (e) { next(e); }
});

router.get('/salary-sheets', checkPermission('hr.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.employeeSalarySheet.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { employee: { select: { name: true, empCode: true } } } }), prisma.employeeSalarySheet.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

// Advance Memos
router.post('/advance', checkPermission('hr.advance.create'), async (req, res, next) => {
    try {
        const adv = await prisma.employeeAdvanceMemo.create({ data: { ...req.body, createdBy: req.user.id } });
        return successResponse(res, adv, 'Advance Memo created', 201);
    } catch (e) { next(e); }
});

router.get('/dashboard', checkPermission('hr.view'), async (req, res, next) => {
    try {
        const [totalEmployees, totalPayroll, pendingAdvances] = await Promise.all([
            prisma.employee.count({ where: { isActive: true } }),
            prisma.employeeSalarySheet.aggregate({ _sum: { netPay: true } }),
            prisma.employeeAdvanceMemo.count({ where: { isRecovered: false } })
        ]);
        return successResponse(res, { stats: { totalEmployees, totalPayroll: totalPayroll._sum.netPay || 0, pendingAdvances } });
    } catch (e) { next(e); }
});

module.exports = router;
