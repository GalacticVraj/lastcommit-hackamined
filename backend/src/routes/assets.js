const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

router.get('/', checkPermission('assets.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip, search } = parseListQuery(req.query);
        const where = { deletedAt: null };
        if (search) where.name = { contains: search };
        const [data, total] = await Promise.all([prisma.asset.findMany({ where, skip, take: perPage, orderBy: { name: 'asc' } }), prisma.asset.count({ where })]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

router.post('/', checkPermission('assets.create'), async (req, res, next) => {
    try {
        const a = await prisma.asset.create({ data: { ...req.body, purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null, createdBy: req.user.id } });
        return successResponse(res, a, 'Asset registered', 201);
    } catch (e) { next(e); }
});

router.get('/:id', checkPermission('assets.view'), async (req, res, next) => {
    try {
        const a = await prisma.asset.findUnique({ where: { id: parseInt(req.params.id) }, include: { additions: true, allocations: { include: { employee: { select: { name: true } } } }, sales: true, depreciations: true } });
        return successResponse(res, a);
    } catch (e) { next(e); }
});

router.post('/additions', checkPermission('assets.addition.create'), async (req, res, next) => {
    try {
        const a = await prisma.assetAddition.create({ data: { ...req.body, installationDate: req.body.installationDate ? new Date(req.body.installationDate) : null, createdBy: req.user.id } });
        return successResponse(res, a, 'Asset Addition recorded', 201);
    } catch (e) { next(e); }
});

router.post('/allocations', checkPermission('assets.allocation.create'), async (req, res, next) => {
    try {
        const a = await prisma.assetAllocation.create({ data: { ...req.body, createdBy: req.user.id } });
        return successResponse(res, a, 'Asset allocated', 201);
    } catch (e) { next(e); }
});

router.post('/sales', checkPermission('assets.sale.create'), async (req, res, next) => {
    try {
        const a = await prisma.assetSale.create({ data: { ...req.body, saleDate: new Date(req.body.saleDate), createdBy: req.user.id } });
        return successResponse(res, a, 'Asset Sale recorded', 201);
    } catch (e) { next(e); }
});

// Depreciation calculation (straight-line)
router.post('/depreciation/calculate', checkPermission('assets.depreciation.create'), async (req, res, next) => {
    try {
        const { year } = req.body;
        const assets = await prisma.asset.findMany({ where: { isActive: true } });
        const results = [];
        for (const asset of assets) {
            const lastDep = await prisma.assetDepreciation.findFirst({ where: { assetId: asset.id }, orderBy: { year: 'desc' } });
            const openingBalance = lastDep ? lastDep.closingBalance : asset.purchaseValue;
            const depAmount = +(openingBalance * asset.depreciationRate / 100).toFixed(2);
            const closingBalance = +(openingBalance - depAmount).toFixed(2);
            const dep = await prisma.assetDepreciation.create({ data: { assetId: asset.id, year, openingBalance, depreciationAmount: depAmount, closingBalance } });
            await prisma.asset.update({ where: { id: asset.id }, data: { currentValue: Math.max(0, closingBalance) } });
            results.push(dep);
        }
        return successResponse(res, results, `Depreciation calculated for ${results.length} assets`);
    } catch (e) { next(e); }
});

router.get('/dashboard/stats', checkPermission('assets.view'), async (req, res, next) => {
    try {
        const [totalAssets, totalValue, totalDepreciation] = await Promise.all([
            prisma.asset.count({ where: { isActive: true } }),
            prisma.asset.aggregate({ where: { isActive: true }, _sum: { purchaseValue: true, currentValue: true } }),
            prisma.assetDepreciation.aggregate({ _sum: { depreciationAmount: true } })
        ]);
        return successResponse(res, { stats: { totalAssets, totalPurchaseValue: totalValue._sum.purchaseValue || 0, totalCurrentValue: totalValue._sum.currentValue || 0, totalDepreciation: totalDepreciation._sum.depreciationAmount || 0 } });
    } catch (e) { next(e); }
});

module.exports = router;
