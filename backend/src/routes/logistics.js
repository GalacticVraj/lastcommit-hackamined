const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/transporters', checkPermission('logistics.view'), async (req, res, next) => {
    try { const data = await prisma.transporter.findMany({ where: { isActive: true } }); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/transporters', checkPermission('logistics.transporter.create'), async (req, res, next) => {
    try { const t = await prisma.transporter.create({ data: { ...req.body, createdBy: req.user.id } }); return successResponse(res, t, 'Transporter created', 201); } catch (e) { next(e); }
});
router.get('/orders', checkPermission('logistics.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.transportOrder.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { transporter: { select: { name: true } } } }), prisma.transportOrder.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/orders', checkPermission('logistics.order.create'), async (req, res, next) => {
    try {
        const orderNo = await generateDocNumber('TO', 'TO');
        const o = await prisma.transportOrder.create({ data: { ...req.body, orderNo, pickupDate: req.body.pickupDate ? new Date(req.body.pickupDate) : null, createdBy: req.user.id } });
        return successResponse(res, o, 'Transport Order created', 201);
    } catch (e) { next(e); }
});
router.get('/freight-bills', checkPermission('logistics.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.freightBill.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma.freightBill.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});
router.post('/freight-bills', checkPermission('logistics.bill.create'), async (req, res, next) => {
    try {
        const billNo = await generateDocNumber('FB', 'FB');
        const b = await prisma.freightBill.create({ data: { ...req.body, billNo, createdBy: req.user.id } });
        return successResponse(res, b, 'Freight Bill created', 201);
    } catch (e) { next(e); }
});
router.get('/dashboard', checkPermission('logistics.view'), async (req, res, next) => {
    try {
        const [totalTransporters, totalOrders, inTransit] = await Promise.all([
            prisma.transporter.count({ where: { isActive: true } }), prisma.transportOrder.count(), prisma.transportOrder.count({ where: { status: 'In-Transit' } })
        ]);
        return successResponse(res, { stats: { totalTransporters, totalOrders, inTransit } });
    } catch (e) { next(e); }
});

module.exports = router;
