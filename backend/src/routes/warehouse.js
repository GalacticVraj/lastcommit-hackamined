const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/warehouses', checkPermission('warehouse.view'), async (req, res, next) => {
    try { const data = await prisma.warehouse.findMany({ where: { isActive: true } }); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/warehouses', checkPermission('warehouse.create'), async (req, res, next) => {
    try { const w = await prisma.warehouse.create({ data: { ...req.body, createdBy: req.user.id } }); return successResponse(res, w, 'Warehouse created', 201); } catch (e) { next(e); }
});

router.get('/stocks', checkPermission('warehouse.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.warehouseStock.findMany({ skip, take: perPage, include: { warehouse: { select: { name: true } }, product: { select: { name: true, code: true } } } }), prisma.warehouseStock.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/stock-transfer', checkPermission('warehouse.transfer.create'), async (req, res, next) => {
    try {
        const transferNo = await generateDocNumber('ST', 'ST');
        const t = await prisma.stockTransfer.create({ data: { ...req.body, transferNo, createdBy: req.user.id } });
        return successResponse(res, t, 'Stock Transfer created', 201);
    } catch (e) { next(e); }
});

router.post('/dispatch-srv', checkPermission('warehouse.srv.create'), async (req, res, next) => {
    try {
        const srvNo = await generateDocNumber('SRV', 'SRV');
        const srv = await prisma.dispatchSRV.create({ data: { ...req.body, srvNo, createdBy: req.user.id } });
        return successResponse(res, srv, 'Dispatch SRV created', 201);
    } catch (e) { next(e); }
});

router.get('/dashboard', checkPermission('warehouse.view'), async (req, res, next) => {
    try {
        const [totalWarehouses, totalItems, totalTransfers] = await Promise.all([
            prisma.warehouse.count({ where: { isActive: true } }), prisma.warehouseStock.count(), prisma.stockTransfer.count()
        ]);
        return successResponse(res, { stats: { totalWarehouses, totalItems, totalTransfers } });
    } catch (e) { next(e); }
});

module.exports = router;
