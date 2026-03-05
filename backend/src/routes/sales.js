const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const salesController = require('../controllers/salesController');

router.use(authenticate);

// Customers
router.get('/customers', checkPermission('sales.view'), salesController.listCustomers);
router.post('/customers', checkPermission('sales.customer.create'), salesController.createCustomer);
router.get('/customers/:id/profile', checkPermission('sales.view'), salesController.getCustomerProfile);
router.get('/customers/:id', checkPermission('sales.view'), salesController.getCustomer);
router.put('/customers/:id', checkPermission('sales.customer.edit'), salesController.updateCustomer);
router.delete('/customers/:id', checkPermission('sales.customer.delete'), salesController.deleteCustomer);

// Inquiries
router.get('/inquiries', checkPermission('sales.view'), salesController.listInquiries);
router.post('/inquiries', checkPermission('sales.inquiry.create'), salesController.createInquiry);
router.get('/inquiries/:id', checkPermission('sales.view'), salesController.getInquiry);
router.put('/inquiries/:id', checkPermission('sales.inquiry.edit'), salesController.updateInquiry);

// Stock Check
router.post('/stock-check', checkPermission('sales.view'), salesController.stockCheck);

// Quotations
router.get('/quotations', checkPermission('sales.view'), salesController.listQuotations);
router.post('/quotations', checkPermission('sales.quotation.create'), salesController.createQuotation);
router.get('/quotations/:id', checkPermission('sales.view'), salesController.getQuotation);
router.put('/quotations/:id', checkPermission('sales.quotation.edit'), salesController.updateQuotation);

// Sale Orders
router.get('/sale-orders', checkPermission('sales.view'), salesController.listSaleOrders);
router.post('/sale-orders', checkPermission('sales.so.create'), salesController.createSaleOrder);
router.get('/sale-orders/:id', checkPermission('sales.view'), salesController.getSaleOrder);
router.put('/sale-orders/:id', checkPermission('sales.so.edit'), salesController.updateSaleOrder);

// Dispatch Advice
router.get('/dispatch-advice', checkPermission('sales.view'), salesController.listDispatchAdvice);
router.post('/dispatch-advice', checkPermission('sales.dispatch.create'), salesController.createDispatchAdvice);

// Invoices
router.get('/invoices', checkPermission('sales.view'), salesController.listInvoices);
router.post('/invoices', checkPermission('sales.invoice.create'), salesController.createInvoice);
router.get('/invoices/:id', checkPermission('sales.view'), salesController.getInvoice);

// Receipt Vouchers
router.get('/receipts', checkPermission('sales.view'), salesController.listReceipts);
router.post('/receipts', checkPermission('sales.receipt.create'), salesController.createReceipt);

// Salesman profile (by employee ID, filtered on salesPerson field)
router.get('/salesmen/:id/profile', checkPermission('sales.view'), salesController.getSalesmanProfile);

// Dashboard
router.get('/dashboard', checkPermission('sales.view'), salesController.dashboard);

module.exports = router;
