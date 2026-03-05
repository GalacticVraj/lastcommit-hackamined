const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, errorResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

const ctrl = {
    // Products
    async listProducts(req, res, next) {
        try {
            const { page, perPage, skip, search } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.name = { contains: search };
            const [data, total] = await Promise.all([prisma.product.findMany({ where, skip, take: perPage, orderBy: { name: 'asc' } }), prisma.product.count({ where })]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },
    async createProduct(req, res, next) {
        try {
            const product = await prisma.product.create({ data: { ...req.body, createdBy: req.user.id } });
            return successResponse(res, product, 'Product created', 201);
        } catch (e) { next(e); }
    },
    async getProduct(req, res, next) {
        try {
            const p = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) }, include: { bomHeaders: { include: { items: true } }, routingTables: true } });
            if (!p) return errorResponse(res, 'Product not found', 404);
            return successResponse(res, p);
        } catch (e) { next(e); }
    },
    async updateProduct(req, res, next) {
        try {
            const p = await prisma.product.update({ where: { id: parseInt(req.params.id) }, data: { ...req.body, updatedBy: req.user.id } });
            return successResponse(res, p, 'Product updated');
        } catch (e) { next(e); }
    },

    // BOM
    async listBOMs(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([prisma.bOMHeader.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true } }, items: true } }), prisma.bOMHeader.count()]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },
    async createBOM(req, res, next) {
        try {
            const bomNo = await generateDocNumber('BOM', 'BOM');
            const { productId, version, items } = req.body;
            const bom = await prisma.bOMHeader.create({ data: { bomNo, productId, version, createdBy: req.user.id, items: { create: items || [] } }, include: { items: true, product: true } });
            return successResponse(res, bom, 'BOM created', 201);
        } catch (e) { next(e); }
    },
    async getBOM(req, res, next) {
        try {
            const b = await prisma.bOMHeader.findUnique({ where: { id: parseInt(req.params.id) }, include: { product: true, items: { include: { product: true } } } });
            if (!b) return errorResponse(res, 'BOM not found', 404);
            return successResponse(res, b);
        } catch (e) { next(e); }
    },

    // Route Cards
    async listRouteCards(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([prisma.productionRouteCard.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma.productionRouteCard.count()]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },
    async createRouteCard(req, res, next) {
        try {
            const routeCardNo = await generateDocNumber('RC', 'RC');
            const rc = await prisma.productionRouteCard.create({ data: { ...req.body, routeCardNo, startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(), createdBy: req.user.id } });
            return successResponse(res, rc, 'Route Card created', 201);
        } catch (e) { next(e); }
    },
    async getRouteCard(req, res, next) {
        try {
            const rc = await prisma.productionRouteCard.findUnique({ where: { id: parseInt(req.params.id) }, include: { materialIssues: { include: { items: true } } } });
            if (!rc) return errorResponse(res, 'Route Card not found', 404);
            return successResponse(res, rc);
        } catch (e) { next(e); }
    },
    async updateRouteCard(req, res, next) {
        try {
            const data = { ...req.body, updatedBy: req.user.id };
            if (req.body.endDate) data.endDate = new Date(req.body.endDate);
            const rc = await prisma.productionRouteCard.update({ where: { id: parseInt(req.params.id) }, data });
            return successResponse(res, rc, 'Route Card updated');
        } catch (e) { next(e); }
    },

    // Material Issue
    async createMaterialIssue(req, res, next) {
        try {
            const issueNo = await generateDocNumber('MIS', 'MIS');
            const { routeCardId, items } = req.body;
            const mi = await prisma.materialIssue.create({ data: { issueNo, routeCardId, createdBy: req.user.id, items: { create: items || [] } }, include: { items: true } });
            for (const item of (items || [])) { await prisma.product.update({ where: { id: item.productId }, data: { currentStock: { decrement: item.qtyIssued } } }); }
            return successResponse(res, mi, 'Material Issue created — stock deducted', 201);
        } catch (e) { next(e); }
    },

    // Material Transfer
    async createMaterialTransfer(req, res, next) {
        try {
            const mtaNo = await generateDocNumber('MTA', 'MTA');
            const mt = await prisma.materialTransfer.create({ data: { ...req.body, mtaNo, createdBy: req.user.id } });
            return successResponse(res, mt, 'Material Transfer created', 201);
        } catch (e) { next(e); }
    },

    // Production Reports
    async listProductionReports(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([prisma.productionReport.findMany({ skip, take: perPage, orderBy: { reportDate: 'desc' }, include: { product: { select: { name: true } } } }), prisma.productionReport.count()]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },
    async createProductionReport(req, res, next) {
        try {
            const rpt = await prisma.productionReport.create({ data: { ...req.body, reportDate: new Date(req.body.reportDate), createdBy: req.user.id } });
            if (req.body.productionQty) { await prisma.product.update({ where: { id: req.body.productId }, data: { currentStock: { increment: req.body.productionQty } } }); }
            return successResponse(res, rpt, 'Production Report logged — stock updated', 201);
        } catch (e) { next(e); }
    },

    // Job Orders
    async listJobOrders(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([prisma.jobOrder.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma.jobOrder.count()]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },
    async createJobOrder(req, res, next) {
        try {
            const jobOrderNo = await generateDocNumber('JO', 'JO');
            const jo = await prisma.jobOrder.create({ data: { ...req.body, jobOrderNo, createdBy: req.user.id, items: { create: req.body.items || [] } }, include: { items: true } });
            return successResponse(res, jo, 'Job Order created', 201);
        } catch (e) { next(e); }
    },
    async createJobChallan(req, res, next) {
        try {
            const challanNo = await generateDocNumber('JC', 'JC');
            const ch = await prisma.jobChallan.create({ data: { ...req.body, challanNo, createdBy: req.user.id } });
            return successResponse(res, ch, 'Job Challan created', 201);
        } catch (e) { next(e); }
    },
    async createJobBill(req, res, next) {
        try {
            const billNo = await generateDocNumber('JB', 'JB');
            const bill = await prisma.jobWorkBill.create({ data: { ...req.body, billNo, createdBy: req.user.id } });
            return successResponse(res, bill, 'Job Work Bill created', 201);
        } catch (e) { next(e); }
    },

    async dashboard(req, res, next) {
        try {
            const [totalProducts, activeCards, totalProduction, totalJobOrders] = await Promise.all([
                prisma.product.count({ where: { isActive: true } }),
                prisma.productionRouteCard.count({ where: { status: { not: 'Closed' } } }),
                prisma.productionReport.aggregate({ _sum: { productionQty: true } }),
                prisma.jobOrder.count({ where: { status: { not: 'Closed' } } })
            ]);
            return successResponse(res, { stats: { totalProducts, activeRouteCards: activeCards, totalProduction: totalProduction._sum.productionQty || 0, activeJobOrders: totalJobOrders } });
        } catch (e) { next(e); }
    }
};

module.exports = ctrl;
