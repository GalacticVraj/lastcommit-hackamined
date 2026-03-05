const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/tools', checkPermission('maintenance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.tool.findMany({ skip, take: perPage, orderBy: { toolName: 'asc' } }), prisma.tool.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/tools', checkPermission('maintenance.tool.create'), async (req, res, next) => {
    try { const t = await prisma.tool.create({ data: { ...req.body, createdBy: req.user.id } }); return successResponse(res, t, 'Tool registered', 201); } catch (e) { next(e); }
});

router.get('/maintenance-charts', checkPermission('maintenance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.toolMaintenanceChart.findMany({ skip, take: perPage, orderBy: { scheduledDate: 'desc' }, include: { tool: { select: { toolName: true } } } }), prisma.toolMaintenanceChart.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/maintenance-charts', checkPermission('maintenance.chart.create'), async (req, res, next) => {
    try { const c = await prisma.toolMaintenanceChart.create({ data: { ...req.body, scheduledDate: new Date(req.body.scheduledDate) } }); return successResponse(res, c, 'Maintenance Chart created', 201); } catch (e) { next(e); }
});

router.get('/calibration', checkPermission('maintenance.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.toolCalibrationReport.findMany({ skip, take: perPage, include: { tool: { select: { toolName: true } } } }), prisma.toolCalibrationReport.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/calibration', checkPermission('maintenance.calibration.create'), async (req, res, next) => {
    try { const c = await prisma.toolCalibrationReport.create({ data: { ...req.body, calibrationDate: new Date(req.body.calibrationDate) } }); return successResponse(res, c, 'Calibration Report created', 201); } catch (e) { next(e); }
});

router.post('/rectification', checkPermission('maintenance.rectification.create'), async (req, res, next) => {
    try { const r = await prisma.toolRectificationMemo.create({ data: req.body }); return successResponse(res, r, 'Rectification Memo created', 201); } catch (e) { next(e); }
});

router.get('/dashboard', checkPermission('maintenance.view'), async (req, res, next) => {
    try {
        const [totalTools, pendingMaintenance, failedCalibrations] = await Promise.all([
            prisma.tool.count({ where: { isActive: true } }),
            prisma.toolMaintenanceChart.count({ where: { status: 'Scheduled' } }),
            prisma.toolCalibrationReport.count({ where: { result: 'Fail' } })
        ]);
        return successResponse(res, { stats: { totalTools, pendingMaintenance, failedCalibrations } });
    } catch (e) { next(e); }
});

module.exports = router;
