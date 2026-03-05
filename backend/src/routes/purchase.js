const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const ctrl = require('../controllers/purchaseController');

router.use(authenticate);

router.get('/vendors', checkPermission('purchase.view'), ctrl.listVendors);
router.post('/vendors', checkPermission('purchase.vendor.create'), ctrl.createVendor);
router.get('/vendors/:id/profile', checkPermission('purchase.view'), ctrl.getVendorProfile);
router.get('/vendors/:id', checkPermission('purchase.view'), ctrl.getVendor);
router.put('/vendors/:id', checkPermission('purchase.vendor.edit'), ctrl.updateVendor);
router.delete('/vendors/:id', checkPermission('purchase.vendor.delete'), ctrl.deleteVendor);

router.get('/indents', checkPermission('purchase.view'), ctrl.listIndents);
router.post('/indents', checkPermission('purchase.indent.create'), ctrl.createIndent);

router.get('/purchase-orders', checkPermission('purchase.view'), ctrl.listPOs);
router.post('/purchase-orders', checkPermission('purchase.po.create'), ctrl.createPO);
router.get('/purchase-orders/:id', checkPermission('purchase.view'), ctrl.getPO);

router.get('/grns', checkPermission('purchase.view'), ctrl.listGRNs);
router.post('/grns', checkPermission('purchase.grn.create'), ctrl.createGRN);
router.put('/grns/:id', checkPermission('purchase.grn.approve'), ctrl.updateGRN);

router.post('/iqc', checkPermission('purchase.iqc.create'), ctrl.createIQC);
router.post('/material-receipts', checkPermission('purchase.receipt.create'), ctrl.createMaterialReceipt);

router.get('/bills', checkPermission('purchase.view'), ctrl.listBills);
router.post('/bills', checkPermission('purchase.bill.create'), ctrl.createBill);

router.post('/payments', checkPermission('purchase.payment.create'), ctrl.createPayment);

router.get('/dashboard', checkPermission('purchase.view'), ctrl.dashboard);
router.get('/stats', checkPermission('purchase.view'), ctrl.stats);

module.exports = router;
