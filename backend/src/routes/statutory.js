const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

// GST Master
router.get('/gst-master', checkPermission('statutory.view'), async (req, res, next) => {
    try { const data = await prisma.gSTMaster.findMany({ where: { isActive: true } }); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/gst-master', checkPermission('statutory.gst.create'), async (req, res, next) => {
    try { const g = await prisma.gSTMaster.create({ data: req.body }); return successResponse(res, g, 'GST Master created', 201); } catch (e) { next(e); }
});

// GSTR-1
router.get('/gstr1', checkPermission('statutory.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.gSTR1Entry.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma.gSTR1Entry.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

// GST Reconciliation
router.get('/reconciliation', checkPermission('statutory.view'), async (req, res, next) => {
    try {
        const { page, perPage, skip } = parseListQuery(req.query);
        const [data, total] = await Promise.all([prisma.gSTReconciliation.findMany({ skip, take: perPage }), prisma.gSTReconciliation.count()]);
        return paginatedResponse(res, data, buildPagination(page, perPage, total));
    } catch (e) { next(e); }
});

// TDS
router.get('/tds', checkPermission('statutory.view'), async (req, res, next) => {
    try { const data = await prisma.tDSDetail.findMany(); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/tds', checkPermission('statutory.tds.create'), async (req, res, next) => {
    try { const t = await prisma.tDSDetail.create({ data: req.body }); return successResponse(res, t, 'TDS entry created', 201); } catch (e) { next(e); }
});

// TCS
router.get('/tcs', checkPermission('statutory.view'), async (req, res, next) => {
    try { const data = await prisma.tCSDetail.findMany(); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/tcs', checkPermission('statutory.tcs.create'), async (req, res, next) => {
    try { const t = await prisma.tCSDetail.create({ data: req.body }); return successResponse(res, t, 'TCS entry created', 201); } catch (e) { next(e); }
});

// Cheque Book
router.get('/cheque-books', checkPermission('statutory.view'), async (req, res, next) => {
    try { const data = await prisma.chequeBook.findMany({ include: { leaves: true } }); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/cheque-books', checkPermission('statutory.cheque.create'), async (req, res, next) => {
    try {
        const { bankAccount, startLeafNo, endLeafNo } = req.body;
        const book = await prisma.chequeBook.create({ data: { bankAccount, startLeafNo, endLeafNo } });
        // Create leaves
        const start = parseInt(startLeafNo); const end = parseInt(endLeafNo);
        const leaves = [];
        for (let i = start; i <= end; i++) { leaves.push({ chequeBookId: book.id, leafNo: String(i) }); }
        await prisma.chequeLeaf.createMany({ data: leaves });
        return successResponse(res, book, 'Cheque Book created with leaves', 201);
    } catch (e) { next(e); }
});

// GST Challans
router.get('/challans', checkPermission('statutory.view'), async (req, res, next) => {
    try { const data = await prisma.gSTChallan.findMany({ orderBy: { challanDate: 'desc' } }); return successResponse(res, data); } catch (e) { next(e); }
});
router.post('/challans', checkPermission('statutory.challan.create'), async (req, res, next) => {
    try { const c = await prisma.gSTChallan.create({ data: { ...req.body, challanDate: new Date(req.body.challanDate) } }); return successResponse(res, c, 'GST Challan created', 201); } catch (e) { next(e); }
});

router.get('/dashboard', checkPermission('statutory.view'), async (req, res, next) => {
    try {
        const [gstEntries, tdsEntries, tcsEntries, challans] = await Promise.all([
            prisma.gSTR1Entry.count(), prisma.tDSDetail.count(), prisma.tCSDetail.count(), prisma.gSTChallan.count()
        ]);
        return successResponse(res, { stats: { gstEntries, tdsEntries, tcsEntries, challans } });
    } catch (e) { next(e); }
});

module.exports = router;
