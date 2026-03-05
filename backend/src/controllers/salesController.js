const prisma = require('../utils/prisma');
const { generateDocNumber } = require('../utils/autoNumber');
const { calculateGST } = require('../utils/gstCalculator');
const { successResponse, paginatedResponse, errorResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

const salesController = {
    // ─── CUSTOMERS ─────────────────────────────────────
    async listCustomers(req, res, next) {
        try {
            const { page, perPage, skip, sortBy, sortOrder, search, filters } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.name = { contains: search };
            if (filters.status) where.isActive = filters.status === 'active';

            const [customers, total] = await Promise.all([
                prisma.customer.findMany({ where, skip, take: perPage, orderBy: { [sortBy]: sortOrder } }),
                prisma.customer.count({ where })
            ]);
            return paginatedResponse(res, customers, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createCustomer(req, res, next) {
        try {
            const customer = await prisma.customer.create({ data: { ...req.body, createdBy: req.user.id } });
            return successResponse(res, customer, 'Customer created', 201);
        } catch (e) { next(e); }
    },

    async getCustomer(req, res, next) {
        try {
            const customer = await prisma.customer.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { inquiries: { take: 10, orderBy: { createdAt: 'desc' } }, invoices: { take: 10, orderBy: { createdAt: 'desc' } } }
            });
            if (!customer) return errorResponse(res, 'Customer not found', 404);
            return successResponse(res, customer);
        } catch (e) { next(e); }
    },

    async updateCustomer(req, res, next) {
        try {
            const customer = await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: { ...req.body, updatedBy: req.user.id } });
            return successResponse(res, customer, 'Customer updated');
        } catch (e) { next(e); }
    },

    async deleteCustomer(req, res, next) {
        try {
            await prisma.customer.update({ where: { id: parseInt(req.params.id) }, data: { deletedAt: new Date(), isActive: false } });
            return successResponse(res, null, 'Customer deleted');
        } catch (e) { next(e); }
    },

    // ─── INQUIRIES ─────────────────────────────────────
    async listInquiries(req, res, next) {
        try {
            const { page, perPage, skip, sortBy, sortOrder, search, filters } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.inquiryNo = { contains: search };
            if (filters.status) where.status = filters.status;

            const [inquiries, total] = await Promise.all([
                prisma.inquiry.findMany({ where, skip, take: perPage, orderBy: { [sortBy]: sortOrder }, include: { customer: { select: { name: true } } } }),
                prisma.inquiry.count({ where })
            ]);
            return paginatedResponse(res, inquiries, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createInquiry(req, res, next) {
        try {
            const inquiryNo = await generateDocNumber('INQ', 'INQ');
            const { customerId, salesPerson, items, remarks } = req.body;

            const inquiry = await prisma.inquiry.create({
                data: {
                    inquiryNo,
                    customerId,
                    salesPerson,
                    remarks,
                    createdBy: req.user.id,
                    items: { create: items || [] }
                },
                include: { items: true, customer: true }
            });

            return successResponse(res, inquiry, 'Inquiry created', 201);
        } catch (e) { next(e); }
    },

    async getInquiry(req, res, next) {
        try {
            const inquiry = await prisma.inquiry.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { items: { include: { product: true } }, customer: true, quotations: true }
            });
            if (!inquiry) return errorResponse(res, 'Inquiry not found', 404);
            return successResponse(res, inquiry);
        } catch (e) { next(e); }
    },

    async updateInquiry(req, res, next) {
        try {
            const inquiry = await prisma.inquiry.update({
                where: { id: parseInt(req.params.id) },
                data: { ...req.body, updatedBy: req.user.id }
            });
            return successResponse(res, inquiry, 'Inquiry updated');
        } catch (e) { next(e); }
    },

    // ─── STOCK CHECK ────────────────────────────────────
    async stockCheck(req, res, next) {
        try {
            const { items } = req.body; // [{ productId, quantity }]
            const results = [];

            for (const item of items) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) continue;

                const netAvailable = product.currentStock - product.blockedStock;
                const today = new Date();
                let deliveryDate;

                if (netAvailable >= item.quantity) {
                    deliveryDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // +2 days
                } else {
                    deliveryDate = new Date(today.getTime() + product.productionDays * 24 * 60 * 60 * 1000);
                }

                results.push({
                    productId: product.id,
                    productName: product.name,
                    currentStock: product.currentStock,
                    blockedStock: product.blockedStock,
                    netAvailable,
                    requestedQty: item.quantity,
                    available: netAvailable >= item.quantity,
                    deliveryDate
                });
            }

            return successResponse(res, results);
        } catch (e) { next(e); }
    },

    // ─── QUOTATIONS ─────────────────────────────────────
    async listQuotations(req, res, next) {
        try {
            const { page, perPage, skip, sortBy, sortOrder, search } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.quoteNo = { contains: search };

            const [quotations, total] = await Promise.all([
                prisma.quotation.findMany({ where, skip, take: perPage, orderBy: { [sortBy]: sortOrder }, include: { customer: { select: { name: true } } } }),
                prisma.quotation.count({ where })
            ]);
            return paginatedResponse(res, quotations, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createQuotation(req, res, next) {
        try {
            const quoteNo = await generateDocNumber('QT', 'QT');
            const { customerId, inquiryId, validUntil, paymentTerms, items } = req.body;

            let totalAmount = 0;
            const processedItems = (items || []).map(item => {
                const lineTotal = item.quantity * item.rate * (1 + (item.gstPercent || 18) / 100);
                totalAmount += lineTotal;
                return { ...item, total: +lineTotal.toFixed(2) };
            });

            const quotation = await prisma.quotation.create({
                data: {
                    quoteNo, customerId, inquiryId, validUntil: new Date(validUntil), paymentTerms,
                    totalAmount: +totalAmount.toFixed(2), createdBy: req.user.id,
                    items: { create: processedItems }
                },
                include: { items: true, customer: true }
            });

            // Update inquiry status
            if (inquiryId) {
                await prisma.inquiry.update({ where: { id: inquiryId }, data: { status: 'Quoted' } });
            }

            return successResponse(res, quotation, 'Quotation created', 201);
        } catch (e) { next(e); }
    },

    async getQuotation(req, res, next) {
        try {
            const quotation = await prisma.quotation.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { items: { include: { product: true } }, customer: true, inquiry: true }
            });
            if (!quotation) return errorResponse(res, 'Quotation not found', 404);
            return successResponse(res, quotation);
        } catch (e) { next(e); }
    },

    async updateQuotation(req, res, next) {
        try {
            const quotation = await prisma.quotation.update({
                where: { id: parseInt(req.params.id) },
                data: { ...req.body, updatedBy: req.user.id }
            });
            return successResponse(res, quotation, 'Quotation updated');
        } catch (e) { next(e); }
    },

    // ─── SALE ORDERS ────────────────────────────────────
    async listSaleOrders(req, res, next) {
        try {
            const { page, perPage, skip, sortBy, sortOrder, search } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.soNo = { contains: search };

            const [orders, total] = await Promise.all([
                prisma.saleOrder.findMany({ where, skip, take: perPage, orderBy: { [sortBy]: sortOrder }, include: { customer: { select: { name: true } } } }),
                prisma.saleOrder.count({ where })
            ]);
            return paginatedResponse(res, orders, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createSaleOrder(req, res, next) {
        try {
            const soNo = await generateDocNumber('SO', 'SO');
            const { customerId, quotationId, customerPoNo, customerPoDate, billingAddress, shippingAddress, items } = req.body;

            let totalAmount = 0;
            const processedItems = (items || []).map(item => {
                const lineTotal = item.quantity * item.rate * (1 + (item.gstPercent || 18) / 100);
                totalAmount += lineTotal;
                return { ...item, total: +lineTotal.toFixed(2) };
            });

            const order = await prisma.saleOrder.create({
                data: {
                    soNo, customerId, quotationId, customerPoNo,
                    customerPoDate: customerPoDate ? new Date(customerPoDate) : null,
                    billingAddress, shippingAddress, totalAmount: +totalAmount.toFixed(2),
                    createdBy: req.user.id,
                    items: { create: processedItems }
                },
                include: { items: true, customer: true }
            });

            return successResponse(res, order, 'Sale Order created', 201);
        } catch (e) { next(e); }
    },

    async getSaleOrder(req, res, next) {
        try {
            const order = await prisma.saleOrder.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { items: { include: { product: true } }, customer: true, invoices: true, dispatchAdvice: true }
            });
            if (!order) return errorResponse(res, 'Sale Order not found', 404);
            return successResponse(res, order);
        } catch (e) { next(e); }
    },

    async updateSaleOrder(req, res, next) {
        try {
            const order = await prisma.saleOrder.update({
                where: { id: parseInt(req.params.id) },
                data: { ...req.body, updatedBy: req.user.id }
            });
            return successResponse(res, order, 'Sale Order updated');
        } catch (e) { next(e); }
    },

    // ─── DISPATCH ADVICE ───────────────────────────────
    async listDispatchAdvice(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [dispatches, total] = await Promise.all([
                prisma.dispatchAdvice.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { saleOrder: { select: { soNo: true } } } }),
                prisma.dispatchAdvice.count()
            ]);
            return paginatedResponse(res, dispatches, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createDispatchAdvice(req, res, next) {
        try {
            const dispatchNo = await generateDocNumber('DA', 'DA');
            const dispatch = await prisma.dispatchAdvice.create({
                data: { ...req.body, dispatchNo, createdBy: req.user.id }
            });
            return successResponse(res, dispatch, 'Dispatch Advice created', 201);
        } catch (e) { next(e); }
    },

    // ─── INVOICES ───────────────────────────────────────
    async listInvoices(req, res, next) {
        try {
            const { page, perPage, skip, sortBy, sortOrder, search } = parseListQuery(req.query);
            const where = { deletedAt: null };
            if (search) where.invoiceNo = { contains: search };

            const [invoices, total] = await Promise.all([
                prisma.invoice.findMany({ where, skip, take: perPage, orderBy: { [sortBy]: sortOrder }, include: { customer: { select: { name: true } } } }),
                prisma.invoice.count({ where })
            ]);
            return paginatedResponse(res, invoices, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createInvoice(req, res, next) {
        try {
            const invoiceNo = await generateDocNumber('INV', 'INV');
            const { customerId, saleOrderId, placeOfSupply, ewayBillNo, items } = req.body;

            // Get customer for GST calculation
            const customer = await prisma.customer.findUnique({ where: { id: customerId } });
            const companyGSTIN = '24AABCU9603R1ZM'; // configurable

            let taxableValue = 0, cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

            const processedItems = (items || []).map(item => {
                const lineTaxable = item.quantity * item.rate;
                const gst = calculateGST(lineTaxable, item.gstPercent || 18, companyGSTIN, customer?.gstin);
                taxableValue += lineTaxable;
                cgstAmount += gst.cgst;
                sgstAmount += gst.sgst;
                igstAmount += gst.igst;
                return { ...item, cgst: gst.cgst, sgst: gst.sgst, igst: gst.igst, total: gst.total };
            });

            const grandTotal = taxableValue + cgstAmount + sgstAmount + igstAmount;
            const roundOff = +(Math.round(grandTotal) - grandTotal).toFixed(2);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (customer?.creditPeriod || 30));

            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNo, customerId, saleOrderId, placeOfSupply, ewayBillNo,
                    taxableValue: +taxableValue.toFixed(2), cgstAmount: +cgstAmount.toFixed(2),
                    sgstAmount: +sgstAmount.toFixed(2), igstAmount: +igstAmount.toFixed(2),
                    roundOff, grandTotal: +(grandTotal + roundOff).toFixed(2),
                    dueDate, createdBy: req.user.id,
                    items: { create: processedItems }
                },
                include: { items: true, customer: true }
            });

            return successResponse(res, invoice, 'Invoice created', 201);
        } catch (e) { next(e); }
    },

    async getInvoice(req, res, next) {
        try {
            const invoice = await prisma.invoice.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { items: { include: { product: true } }, customer: true, reminders: true, communications: true }
            });
            if (!invoice) return errorResponse(res, 'Invoice not found', 404);
            return successResponse(res, invoice);
        } catch (e) { next(e); }
    },

    // ─── RECEIPT VOUCHERS ──────────────────────────────
    async listReceipts(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [receipts, total] = await Promise.all([
                prisma.salesReceiptVoucher.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true } } } }),
                prisma.salesReceiptVoucher.count()
            ]);
            return paginatedResponse(res, receipts, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async createReceipt(req, res, next) {
        try {
            const receiptNo = await generateDocNumber('RV', 'RV');
            const receipt = await prisma.salesReceiptVoucher.create({
                data: { ...req.body, receiptNo, createdBy: req.user.id }
            });

            // Update invoice status if linked
            if (req.body.invoiceId) {
                const invoice = await prisma.invoice.findUnique({ where: { id: req.body.invoiceId } });
                if (invoice) {
                    const totalReceipts = await prisma.salesReceiptVoucher.aggregate({
                        where: { invoiceId: req.body.invoiceId },
                        _sum: { amount: true }
                    });
                    const totalPaid = totalReceipts._sum.amount || 0;
                    const newStatus = totalPaid >= invoice.grandTotal ? 'Paid' : 'Partial';
                    await prisma.invoice.update({ where: { id: req.body.invoiceId }, data: { status: newStatus } });
                }
            }

            return successResponse(res, receipt, 'Receipt Voucher created', 201);
        } catch (e) { next(e); }
    },

    // ─── DASHBOARD ──────────────────────────────────────
    async dashboard(req, res, next) {
        try {
            const [
                totalCustomers, totalInvoices, totalRevenue, overdueInvoices,
                recentInvoices, monthlyData, statusBreakdown
            ] = await Promise.all([
                prisma.customer.count({ where: { isActive: true, deletedAt: null } }),
                prisma.invoice.count({ where: { deletedAt: null } }),
                prisma.invoice.aggregate({ where: { deletedAt: null }, _sum: { grandTotal: true } }),
                prisma.invoice.count({ where: { status: 'Overdue', deletedAt: null } }),
                prisma.invoice.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { customer: { select: { name: true } } } }),
                prisma.invoice.groupBy({ by: ['status'], _count: true }),
                prisma.inquiry.groupBy({ by: ['status'], _count: true })
            ]);

            return successResponse(res, {
                stats: {
                    totalCustomers,
                    totalInvoices,
                    totalRevenue: totalRevenue._sum.grandTotal || 0,
                    overdueInvoices
                },
                recentInvoices,
                invoicesByStatus: monthlyData,
                inquiriesByStatus: statusBreakdown
            });
        } catch (e) { next(e); }
    }
};

module.exports = salesController;
