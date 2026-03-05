const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const ctrl = require('../controllers/productionController');

router.use(authenticate);

router.get('/products', checkPermission('production.view'), ctrl.listProducts);
router.post('/products', checkPermission('production.product.create'), ctrl.createProduct);
router.get('/products/:id', checkPermission('production.view'), ctrl.getProduct);
router.put('/products/:id', checkPermission('production.product.edit'), ctrl.updateProduct);

router.get('/bom', checkPermission('production.view'), ctrl.listBOMs);
router.post('/bom', checkPermission('production.bom.create'), ctrl.createBOM);
router.get('/bom/:id', checkPermission('production.view'), ctrl.getBOM);

router.get('/route-cards', checkPermission('production.view'), ctrl.listRouteCards);
router.post('/route-cards', checkPermission('production.routecard.create'), ctrl.createRouteCard);
router.get('/route-cards/:id', checkPermission('production.view'), ctrl.getRouteCard);
router.put('/route-cards/:id', checkPermission('production.routecard.edit'), ctrl.updateRouteCard);

router.post('/material-issues', checkPermission('production.issue.create'), ctrl.createMaterialIssue);
router.post('/material-transfers', checkPermission('production.transfer.create'), ctrl.createMaterialTransfer);

router.get('/reports', checkPermission('production.view'), ctrl.listProductionReports);
router.post('/reports', checkPermission('production.report.create'), ctrl.createProductionReport);

router.get('/job-orders', checkPermission('production.view'), ctrl.listJobOrders);
router.post('/job-orders', checkPermission('production.job.create'), ctrl.createJobOrder);
router.post('/job-challans', checkPermission('production.challan.create'), ctrl.createJobChallan);
router.post('/job-bills', checkPermission('production.bill.create'), ctrl.createJobBill);

router.get('/dashboard', checkPermission('production.view'), ctrl.dashboard);

module.exports = router;
