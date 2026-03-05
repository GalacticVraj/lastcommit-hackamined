const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

router.use(authenticate);

// IQC, MTS, PQC, PDI, QRD
const models = { iqc: 'iQCRecord', mts: 'mTSRecord', pqc: 'pQCRecord', pdi: 'pDIRecord', qrd: 'qRDRecord' };

Object.entries(models).forEach(([route, model]) => {
    router.get(`/${route}`, checkPermission('quality.view'), async (req, res, next) => {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([prisma[model].findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }), prisma[model].count()]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    });

    router.post(`/${route}`, checkPermission(`quality.${route}.create`), async (req, res, next) => {
        try {
            const record = await prisma[model].create({ data: { ...req.body, createdBy: req.user.id } });
            return successResponse(res, record, `${route.toUpperCase()} record created`, 201);
        } catch (e) { next(e); }
    });
});

router.get('/dashboard', checkPermission('quality.view'), async (req, res, next) => {
    try {
        const [iqcCount, pqcCount, pdiCount, qrdCount] = await Promise.all([
            prisma.iQCRecord.count(), prisma.pQCRecord.count(), prisma.pDIRecord.count(), prisma.qRDRecord.count()
        ]);
        return successResponse(res, { stats: { iqcRecords: iqcCount, pqcRecords: pqcCount, pdiRecords: pdiCount, qrdRecords: qrdCount } });
    } catch (e) { next(e); }
});

module.exports = router;
