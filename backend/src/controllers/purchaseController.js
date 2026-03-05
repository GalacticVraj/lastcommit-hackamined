const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { successResponse, paginatedResponse, errorResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

const ctrl = {
    async listVendors(req, res, next) {
        try {
            const { page, perPage, skip, search } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.name = { contains: search };
            const [data, total] = await Promise.all([
                prisma.vendor.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
                prisma.vendor.count({ where })
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createVendor(req, res, next) {
        try {
            const vendor = await prisma.vendor.create({ data: { ...req.body, createdBy: req.user.id } });
            return successResponse(res, vendor, 'Vendor created', 201);
        } catch (e) { next(e); }
    },

    async getVendor(req, res, next) {
        try {
            const v = await prisma.vendor.findUnique({ where: { id: parseInt(req.params.id) }, include: { purchaseOrders: { take: 10, orderBy: { createdAt: 'desc' } } } });
            if (!v) return errorResponse(res, 'Vendor not found', 404);
            return successResponse(res, v);
        } catch (e) { next(e); }
    },

    async updateVendor(req, res, next) {
        try {
            const v = await prisma.vendor.update({ where: { id: parseInt(req.params.id) }, data: { ...req.body, updatedBy: req.user.id } });
            return successResponse(res, v, 'Vendor updated');
        } catch (e) { next(e); }
    },

    async getVendorProfile(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const [vendor, purchaseOrders, bills, payments] = await Promise.all([
                prisma.vendor.findUnique({ where: { id } }),
                prisma.purchaseOrder.findMany({ where: { vendorId: id, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
                prisma.purchaseBill.findMany({ where: { vendorId: id, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
                prisma.purchasePaymentVoucher.findMany({ where: { vendorId: id }, orderBy: { paymentDate: 'desc' } }),
            ]);
            if (!vendor) return errorResponse(res, 'Vendor not found', 404);

            const totalPurchases = bills.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
            const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
            const outstanding = totalPurchases - totalPaid;

            return successResponse(res, {
                vendor, purchaseOrders, bills, payments,
                metrics: { totalPurchases, totalPaid, outstanding, totalOrders: purchaseOrders.length }
            });
        } catch (e) { next(e); }
    },

    async deleteVendor(req, res, next) {
        try {
            await prisma.vendor.update({ where: { id: parseInt(req.params.id) }, data: { deletedAt: new Date(), isActive: false } });
            return successResponse(res, null, 'Vendor deleted');
        } catch (e) { next(e); }
    },

    async listIndents(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([
                prisma.materialIndent.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } } } }),
                prisma.materialIndent.count()
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createIndent(req, res, next) {
        try {
            const indentNo = await generateDocNumber('MI', 'MI');
            const { department, priority, items } = req.body;
            const indent = await prisma.materialIndent.create({
                data: { indentNo, department, priority, createdBy: req.user.id, items: { create: items || [] } },
                include: { items: true }
            });
            return successResponse(res, indent, 'Material Indent created', 201);
        } catch (e) { next(e); }
    },

    async listPOs(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([
                prisma.purchaseOrder.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { vendor: { select: { name: true } } } }),
                prisma.purchaseOrder.count()
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createPO(req, res, next) {
        try {
            const poNo = await generateDocNumber('PO', 'PO');
            const { vendorId, validUntil, items } = req.body;
            let totalAmount = 0;
            const processedItems = (items || []).map(i => { const t = i.quantity * i.rate; totalAmount += t; return { ...i, total: +t.toFixed(2) }; });
            const po = await prisma.purchaseOrder.create({
                data: { poNo, vendorId, validUntil: validUntil ? new Date(validUntil) : null, totalAmount: +totalAmount.toFixed(2), createdBy: req.user.id, items: { create: processedItems } },
                include: { items: true, vendor: true }
            });
            return successResponse(res, po, 'Purchase Order created', 201);
        } catch (e) { next(e); }
    },

    async getPO(req, res, next) {
        try {
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { vendor: true, items: { include: { product: true } }, grns: true, schedules: true }
            });
            if (!po) return errorResponse(res, 'PO not found', 404);
            return successResponse(res, po);
        } catch (e) { next(e); }
    },

    async listGRNs(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([
                prisma.gRN.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { vendor: { select: { name: true } } } }),
                prisma.gRN.count()
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createGRN(req, res, next) {
        try {
            const grnNo = await generateDocNumber('GRN', 'GRN');
            const { vendorId, purchaseOrderId, vendorChallanNo, vehicleNo, items } = req.body;
            const grn = await prisma.gRN.create({
                data: { grnNo, vendorId, purchaseOrderId, vendorChallanNo, vehicleNo, createdBy: req.user.id, items: { create: items || [] } },
                include: { items: true, vendor: true }
            });
            return successResponse(res, grn, 'GRN created', 201);
        } catch (e) { next(e); }
    },

    async updateGRN(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const grn = await prisma.$transaction(async (tx) => {
                const updated = await tx.gRN.update({
                    where: { id },
                    data: { ...req.body, updatedBy: req.user.id },
                    include: { items: true }
                });

                // Cascade: when GRN is approved (Passed), add quantities to warehouse stock
                if (req.body.status === 'Passed') {
                    for (const item of updated.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { currentStock: { increment: item.quantity } }
                        });
                    }
                }
                return updated;
            });
            return successResponse(res, grn, 'GRN updated — stock incremented');
        } catch (e) { next(e); }
    },


    async createIQC(req, res, next) {
        try {
            const iqc = await prisma.iQCRecord.create({ data: { ...req.body, createdBy: req.user.id } });
            return successResponse(res, iqc, 'IQC record created', 201);
        } catch (e) { next(e); }
    },

    async createMaterialReceipt(req, res, next) {
        try {
            const receiptNo = await generateDocNumber('MR', 'MR');
            const { grnId, storageLocation, batchNo, items } = req.body;

            const receipt = await prisma.$transaction(async (tx) => {
                const newReceipt = await tx.materialReceipt.create({
                    data: { receiptNo, grnId, storageLocation, batchNo, createdBy: req.user.id, items: { create: items || [] } },
                    include: { items: true }
                });

                // Update stock for each item
                for (const item of (items || [])) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { currentStock: { increment: item.quantity } }
                    });
                }
                return newReceipt;
            });

            return successResponse(res, receipt, 'Material Receipt created — stock updated', 201);
        } catch (e) { next(e); }
    },

    async listBills(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([
                prisma.purchaseBill.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { vendor: { select: { name: true } } } }),
                prisma.purchaseBill.count()
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createBill(req, res, next) {
        try {
            const billNo = await generateDocNumber('PB', 'PB');
            const bill = await prisma.purchaseBill.create({ data: { ...req.body, billNo, invoiceDate: new Date(req.body.invoiceDate), createdBy: req.user.id } });
            return successResponse(res, bill, 'Purchase Bill created', 201);
        } catch (e) { next(e); }
    },

    async createPayment(req, res, next) {
        try {
            const voucherNo = await generateDocNumber('PV', 'PV');
            const payment = await prisma.purchasePaymentVoucher.create({ data: { ...req.body, voucherNo, createdBy: req.user.id } });
            return successResponse(res, payment, 'Payment Voucher created', 201);
        } catch (e) { next(e); }
    },

    async dashboard(req, res, next) {
        try {
            const [totalVendors, totalPOs, totalBills, pendingGRNs] = await Promise.all([
                prisma.vendor.count({ where: { isActive: true } }),
                prisma.purchaseOrder.count(),
                prisma.purchaseBill.aggregate({ _sum: { totalAmount: true } }),
                prisma.gRN.count({ where: { status: 'Pending IQC' } })
            ]);
            return successResponse(res, { stats: { totalVendors, totalPOs, totalSpend: totalBills._sum.totalAmount || 0, pendingGRNs } });
        } catch (e) { next(e); }
    }
};

module.exports = ctrl;
