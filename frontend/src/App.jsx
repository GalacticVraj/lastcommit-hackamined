import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './lib/auth';
import useSessionTimeout from './hooks/useSessionTimeout';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import SimulationPage from './pages/SimulationPage';
import ReportsPage from './pages/ReportsPage';
import GenericModulePage from './pages/GenericModulePage';
import TopProgressBar from './components/TopProgressBar';
import PrintPage from './pages/PrintPage';

import CustomerProfilePage from './pages/CustomerProfilePage';
import VendorProfilePage from './pages/VendorProfilePage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import SalesmanProfilePage from './pages/SalesmanProfilePage';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const token = useAuthStore(s => s.token) || localStorage.getItem('erp_token');
  const rehydrate = useAuthStore(s => s.rehydrate);
  const permissionsLoaded = useAuthStore(s => s.permissionsLoaded);

  useSessionTimeout(60);

  // Rehydrate permissions from backend on page refresh
  useEffect(() => {
    if (token && !permissionsLoaded) {
      rehydrate();
    }
  }, [token, permissionsLoaded, rehydrate]);

  return (isAuthenticated && token) ? children : <Navigate to="/login" replace />;
}

// Module configurations for GenericModulePage
const purchaseConfig = {
  title: 'Purchase Management', apiBase: '/purchase',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'vendors', label: 'Vendors', endpoint: '/vendors', columns: ['name', 'gstin', 'city', 'state', 'contactPerson'], formFields: [{ name: 'name', label: 'Name', required: true }, { name: 'gstin', label: 'GSTIN' }, { name: 'address', label: 'Address' }, { name: 'city', label: 'City' }, { name: 'state', label: 'State' }, { name: 'contactPerson', label: 'Contact Person' }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email' }] },
    { key: 'pos', label: 'Purchase Orders', endpoint: '/purchase-orders', columns: ['poNo', 'vendor.name', 'totalAmount', 'status'], formFields: [{ name: 'vendorId', label: 'Vendor ID', type: 'number', required: true }, { name: 'vendorQuotationNo', label: 'Vendor Quote No' }], hasItems: true, hasPrint: true, printType: 'purchase-order' },
    { key: 'grns', label: 'GRNs', endpoint: '/grns', columns: ['grnNo', 'vendor.name', 'status'], formFields: [{ name: 'vendorId', label: 'Vendor ID', type: 'number', required: true }, { name: 'purchaseOrderId', label: 'PO ID', type: 'number' }, { name: 'challanNo', label: 'Challan No' }], hasItems: true, hasPrint: true, printType: 'grn' },
    { key: 'bills', label: 'Bills', endpoint: '/bills', columns: ['billNo', 'vendor.name', 'totalAmount', 'status'], formFields: [{ name: 'vendorId', label: 'Vendor ID', type: 'number', required: true }, { name: 'purchaseOrderId', label: 'PO ID', type: 'number' }, { name: 'vendorInvoiceNo', label: 'Vendor Invoice No' }], hasItems: true, hasPrint: true, printType: 'purchase-bill' },
  ]
};

const productionConfig = {
  title: 'Production Management', apiBase: '/production',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: 'Products', endpoint: '/products', columns: ['code', 'name', 'category', 'unit', 'currentStock', 'lastPurchasePrice'], formFields: [{ name: 'code', label: 'Code', required: true }, { name: 'name', label: 'Name', required: true }, { name: 'category', label: 'Category' }, { name: 'unit', label: 'Unit' }, { name: 'hsnCode', label: 'HSN Code' }, { name: 'gstPercent', label: 'GST %', type: 'number' }, { name: 'currentStock', label: 'Current Stock', type: 'number' }] },
    { key: 'bom', label: 'BOM', endpoint: '/bom', columns: ['bomNo', 'product.name', 'version'] },
    { key: 'rcs', label: 'Route Cards', endpoint: '/route-cards', columns: ['routeCardNo', 'batchNo', 'planQty', 'status'] },
    { key: 'reports', label: 'Reports', endpoint: '/reports', columns: ['reportDate', 'product.name', 'productionQty', 'rejectionQty'] },
    { key: 'jobs', label: 'Job Orders', endpoint: '/job-orders', columns: ['jobOrderNo', 'contractorName', 'processRequired', 'status'] },
  ]
};

const financeConfig = {
  title: 'Finance Management', apiBase: '/finance',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { 
      key: 'voucherJournals', 
      label: 'Voucher Journal', 
      endpoint: '/voucher-journals', 
      columns: ['journalNo', 'date', 'debitAccount', 'creditAccount', 'amount', 'narration'], 
      hasPrint: true,
      printType: 'voucher-journal',
      formFields: [
        { name: 'date', label: 'Date', type: 'date', required: true }, 
        { name: 'debitAccount', label: 'Debit Account', required: true }, 
        { name: 'creditAccount', label: 'Credit Account', required: true }, 
        { name: 'amount', label: 'Amount', type: 'number', required: true }, 
        { name: 'narration', label: 'Narration' }
      ] 
    },
    { 
      key: 'voucherPaymentReceipts', 
      label: 'Payment & Receipt', 
      endpoint: '/voucher-payment-receipts', 
      columns: ['voucherNo', 'voucherType', 'date', 'partyName', 'amount', 'mode'], 
      hasPrint: true,
      printType: 'voucher-payment-receipt',
      formFields: [
        { name: 'voucherType', label: 'Voucher Type', type: 'select', options: ['Payment', 'Receipt'], required: true }, 
        { name: 'date', label: 'Date', type: 'date', required: true }, 
        { name: 'partyName', label: 'Party Name', required: true }, 
        { name: 'amount', label: 'Amount', type: 'number', required: true }, 
        { name: 'mode', label: 'Mode', type: 'select', options: ['Cash', 'Bank', 'Cheque', 'Online', 'UPI', 'Card'], required: true },
        { name: 'referenceNo', label: 'Reference No' },
        { name: 'remarks', label: 'Remarks' }
      ] 
    },
    { 
      key: 'voucherContras', 
      label: 'Voucher Contra', 
      endpoint: '/voucher-contras', 
      columns: ['voucherNo', 'date', 'fromAccount', 'toAccount', 'amount'], 
      hasPrint: true,
      printType: 'voucher-contra',
      formFields: [
        { name: 'date', label: 'Date', type: 'date', required: true }, 
        { name: 'fromAccount', label: 'From Account (e.g., Cash)', required: true }, 
        { name: 'toAccount', label: 'To Account (e.g., Bank)', required: true }, 
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'remarks', label: 'Remarks' }
      ] 
    },
    { 
      key: 'voucherGSTs', 
      label: 'Journal Voucher (GST)', 
      endpoint: '/voucher-gsts', 
      columns: ['voucherNo', 'date', 'gstLedger', 'adjustmentType', 'amount'], 
      hasPrint: true,
      printType: 'voucher-gst',
      formFields: [
        { name: 'date', label: 'Date', type: 'date', required: true }, 
        { name: 'gstLedger', label: 'GST Ledger', type: 'select', options: ['Input', 'Output'], required: true }, 
        { name: 'adjustmentType', label: 'Adjustment Type', type: 'select', options: ['Reversal', 'Adjustment', 'Correction', 'Refund'], required: true }, 
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'remarks', label: 'Remarks' }
      ] 
    },
    { key: 'recon', label: 'Bank Reconciliation', endpoint: '/bank-reconciliation', columns: ['bankAccount', 'statementDate', 'systemBalance', 'bankBalance', 'status'], hasPrint: true, printType: 'bank-reconciliation' },
    { key: 'cc', label: 'Credit Card', endpoint: '/credit-card', columns: ['cardNo', 'statementMonth', 'merchant', 'amount'], hasPrint: true, printType: 'credit-card-statement' },
  ]
};

const hrConfig = {
  title: 'HR Management', apiBase: '/hr',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { 
      key: 'employees', 
      label: 'Employees', 
      endpoint: '/employees', 
      columns: ['empCode', 'name', 'designation', 'department', 'mobile', 'basicSalary', 'isActive'],
      viewFields: [
        { key: 'id', label: 'ID' },
        { key: 'empCode', label: 'Emp Code' },
        { key: 'name', label: 'Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'department', label: 'Department' },
        { key: 'doj', label: 'Date of Joining' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'email', label: 'Email' },
        { key: 'panNo', label: 'PAN No' },
        { key: 'aadharNo', label: 'Aadhar No' },
        { key: 'bankName', label: 'Bank Name' },
        { key: 'bankAccount', label: 'Bank Account' },
        { key: 'ifscCode', label: 'IFSC Code' },
        { key: 'basicSalary', label: 'Basic Salary' },
        { key: 'hra', label: 'HRA' },
        { key: 'da', label: 'DA' },
        { key: 'otherAllowances', label: 'Other Allowances' },
        { key: 'esicApplicable', label: 'ESIC Applicable' },
        { key: 'pfApplicable', label: 'PF Applicable' },
        { key: 'isActive', label: 'Active' },
        { key: 'createdAt', label: 'Created At' },
      ],
      formFields: [
        { name: 'empCode', label: 'Emp Code', required: true }, 
        { name: 'name', label: 'Name', required: true }, 
        { name: 'designation', label: 'Designation' }, 
        { name: 'department', label: 'Department', type: 'select', options: ['Production', 'Quality', 'Sales', 'HR', 'Finance', 'Purchase', 'Warehouse', 'Admin'] },
        { name: 'doj', label: 'Date of Joining', type: 'date' },
        { name: 'mobile', label: 'Mobile' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'panNo', label: 'PAN No' },
        { name: 'aadharNo', label: 'Aadhar No' },
        { name: 'bankName', label: 'Bank Name' },
        { name: 'bankAccount', label: 'Bank Account' },
        { name: 'ifscCode', label: 'IFSC Code' },
        { name: 'basicSalary', label: 'Basic Salary', type: 'number', required: true },
        { name: 'hra', label: 'HRA', type: 'number' },
        { name: 'da', label: 'DA', type: 'number' },
        { name: 'otherAllowances', label: 'Other Allowances', type: 'number' },
      ] 
    },
    { 
      key: 'salaryheads', 
      label: 'Salary Heads', 
      endpoint: '/salary-heads', 
      columns: ['headCode', 'headName', 'headType', 'description', 'isActive'],
      viewFields: [
        { key: 'id', label: 'ID' },
        { key: 'headCode', label: 'Head Code' },
        { key: 'headName', label: 'Head Name' },
        { key: 'headType', label: 'Type (Earning/Deduction)' },
        { key: 'description', label: 'Description' },
        { key: 'isActive', label: 'Active' },
        { key: 'createdAt', label: 'Created At' },
      ],
      formFields: [
        { name: 'headCode', label: 'Head Code', required: true },
        { name: 'headName', label: 'Head Name', required: true },
        { name: 'headType', label: 'Type', type: 'select', options: ['Earning', 'Deduction'], required: true },
        { name: 'description', label: 'Description' },
      ]
    },
    { 
      key: 'salarystructures', 
      label: 'Salary Structures', 
      endpoint: '/salary-structures', 
      columns: ['employee.name', 'effectiveDate', 'basic', 'hra', 'da', 'pfPercent', 'esicPercent', 'otherAllowances'],
      viewFields: [
        { key: 'id', label: 'ID' },
        { key: 'employee.name', label: 'Employee Name' },
        { key: 'employee.empCode', label: 'Emp Code' },
        { key: 'effectiveDate', label: 'Effective Date' },
        { key: 'basic', label: 'Basic' },
        { key: 'hra', label: 'HRA' },
        { key: 'da', label: 'DA' },
        { key: 'pfPercent', label: 'PF %' },
        { key: 'esicPercent', label: 'ESIC %' },
        { key: 'otherAllowances', label: 'Other Allowances' },
        { key: 'remarks', label: 'Remarks' },
        { key: 'isActive', label: 'Active' },
        { key: 'createdAt', label: 'Created At' },
      ],
      formFields: [
        { name: 'employeeId', label: 'Employee', type: 'select', optionsEndpoint: '/hr/dropdown/employees', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
        { name: 'basic', label: 'Basic', type: 'number', required: true },
        { name: 'hra', label: 'HRA', type: 'number' },
        { name: 'da', label: 'DA', type: 'number' },
        { name: 'pfPercent', label: 'PF %', type: 'number' },
        { name: 'esicPercent', label: 'ESIC %', type: 'number' },
        { name: 'otherAllowances', label: 'Other Allowances', type: 'number' },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
    { 
      key: 'salarysheets', 
      label: 'Salary Sheets', 
      endpoint: '/salary-sheets', 
      columns: ['employee.name', 'month', 'year', 'totalDays', 'presentDays', 'grossSalary', 'deductions', 'netPay', 'status'],
      viewFields: [
        { key: 'id', label: 'ID' },
        { key: 'employee.name', label: 'Employee Name' },
        { key: 'employee.empCode', label: 'Emp Code' },
        { key: 'month', label: 'Month' },
        { key: 'year', label: 'Year' },
        { key: 'totalDays', label: 'Total Days' },
        { key: 'presentDays', label: 'Present Days' },
        { key: 'absentDays', label: 'Absent Days' },
        { key: 'grossSalary', label: 'Gross Salary' },
        { key: 'pfDeduction', label: 'PF Deduction' },
        { key: 'esicDeduction', label: 'ESIC Deduction' },
        { key: 'tdsDeduction', label: 'TDS Deduction' },
        { key: 'otherDeductions', label: 'Other Deductions' },
        { key: 'deductions', label: 'Total Deductions' },
        { key: 'netPay', label: 'Net Pay' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created At' },
      ],
      formFields: [
        { 
          name: 'employeeId', 
          label: 'Employee', 
          type: 'select', 
          optionsEndpoint: '/hr/dropdown/employees-with-structures', 
          optionsValue: 'id', 
          optionsLabel: 'label', 
          required: true,
          autoPopulateEndpoint: '/hr/employee/{value}/salary-structure',
          autoPopulateMap: {
            'calculated.grossSalary': 'grossSalary',
            'calculated.pfDeduction': 'pfDeduction',
            'calculated.esicDeduction': 'esicDeduction',
            'calculated.netPay': 'netPay'
          }
        },
        { name: 'month', label: 'Month', type: 'select', options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], required: true },
        { name: 'year', label: 'Year', type: 'number', required: true },
        { name: 'totalDays', label: 'Total Days', type: 'number' },
        { name: 'presentDays', label: 'Present Days', type: 'number' },
        { name: 'absentDays', label: 'Absent Days', type: 'number' },
        { name: 'grossSalary', label: 'Gross Salary', type: 'number' },
        { name: 'pfDeduction', label: 'PF Deduction', type: 'number' },
        { name: 'esicDeduction', label: 'ESIC Deduction', type: 'number' },
        { name: 'tdsDeduction', label: 'TDS Deduction', type: 'number' },
        { name: 'otherDeductions', label: 'Other Deductions', type: 'number' },
        { name: 'netPay', label: 'Net Pay', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Processed', 'Paid'] },
      ]
    },
    { 
      key: 'advances', 
      label: 'Advances', 
      endpoint: '/advances', 
      columns: ['employee.name', 'advanceDate', 'amount', 'purpose', 'balanceAmount', 'status'],
      viewFields: [
        { key: 'id', label: 'ID' },
        { key: 'employee.name', label: 'Employee Name' },
        { key: 'employee.empCode', label: 'Emp Code' },
        { key: 'advanceDate', label: 'Advance Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'recoveryMonth', label: 'Recovery Month' },
        { key: 'recoveryMonths', label: 'Recovery Months' },
        { key: 'monthlyDeduction', label: 'Monthly Deduction' },
        { key: 'recoveredAmount', label: 'Recovered Amount' },
        { key: 'balanceAmount', label: 'Balance Amount' },
        { key: 'status', label: 'Status' },
        { key: 'remarks', label: 'Remarks' },
        { key: 'createdAt', label: 'Created At' },
      ],
      formFields: [
        { name: 'employeeId', label: 'Employee', type: 'select', optionsEndpoint: '/hr/dropdown/employees', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'advanceDate', label: 'Advance Date', type: 'date', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'purpose', label: 'Purpose', required: true },
        { name: 'recoveryMonth', label: 'Recovery Start Month', required: true },
        { name: 'recoveryMonths', label: 'No. of Recovery Months', type: 'number', required: true },
        { name: 'remarks', label: 'Remarks' },
      ],
      statusActions: [
        { status: 'Approved', label: 'Approve', confirmMessage: 'Approve this advance request?', class: 'btn-primary' },
        { status: 'Cancelled', label: 'Cancel', confirmMessage: 'Cancel this advance request?', class: 'btn-danger' },
      ]
    },
  ]
};

const qualityConfig = {
  title: 'Quality Management', apiBase: '/quality',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    {
      key: 'iqc',
      label: 'IQC (Incoming)',
      endpoint: '/iqc',
      columns: ['grnRef', 'item', 'sampleQty', 'visualCheck', 'dimensionCheck', 'status'],
      hasPrint: true,
      printType: 'quality-iqc',
      formFields: [
        { name: 'grnId', label: 'GRN Ref', type: 'select', optionsEndpoint: '/purchase/grns', optionsValue: 'id', optionsLabel: 'grnNo' },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'sampleQty', label: 'Sample Qty', type: 'number', required: true },
        { name: 'visualCheck', label: 'Visual Check', type: 'select', options: ['Pass', 'Fail'], required: true },
        { name: 'dimensionCheck', label: 'Dimension Check', type: 'select', options: ['Pass', 'Fail'], required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Pass', 'Fail', 'Hold'] },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
    {
      key: 'mts',
      label: 'MTS',
      endpoint: '/mts',
      columns: ['mtaRef', 'item', 'qtyChecked', 'status'],
      hasPrint: true,
      printType: 'quality-mts',
      formFields: [
        { name: 'mtaRef', label: 'MTA Ref' },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'qtyChecked', label: 'Qty Checked', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['OK', 'Damaged'], required: true },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
    {
      key: 'pqc',
      label: 'PQC',
      endpoint: '/pqc',
      columns: ['routeCardRef', 'stageName', 'operator', 'status'],
      hasPrint: true,
      printType: 'quality-pqc',
      formFields: [
        { name: 'routeCardRef', label: 'Route Card Ref', required: true },
        { name: 'stageName', label: 'Stage Name', required: true },
        { name: 'operator', label: 'Operator', required: true },
        { name: 'observations', label: 'Observations' },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
      ]
    },
    {
      key: 'pdi',
      label: 'PDI (Pre-Dispatch)',
      endpoint: '/pdi',
      columns: ['soRef', 'boxNo', 'packagingCondition', 'labelAccuracy', 'overallResult'],
      hasPrint: true,
      printType: 'quality-pdi',
      formFields: [
        { name: 'soRef', label: 'SO Ref', required: true },
        { name: 'boxNo', label: 'Box No', required: true },
        { name: 'packagingCondition', label: 'Packaging Condition', type: 'select', options: ['Good', 'Damaged'], required: true },
        { name: 'labelAccuracy', label: 'Label Accuracy', type: 'select', options: ['Accurate', 'Mismatch'], required: true },
        { name: 'overallResult', label: 'Overall Result', type: 'select', options: ['Pass', 'Fail', 'Hold'] },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
    {
      key: 'qrd',
      label: 'QRD',
      endpoint: '/qrd',
      columns: ['rejectionId', 'item', 'qty', 'action'],
      hasPrint: true,
      printType: 'quality-qrd',
      formFields: [
        { name: 'rejectionId', label: 'Rejection ID' },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label' },
        { name: 'qty', label: 'Qty', type: 'number', required: true },
        { name: 'action', label: 'Action', type: 'select', options: ['Scrap', 'Return', 'Rework', 'Downgrade'], required: true },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
  ]
};

const warehouseConfig = {
  title: 'Warehouse Management', apiBase: '/warehouse',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'warehouses', label: 'Warehouses', endpoint: '/warehouses', columns: ['name', 'address', 'managerName'], formFields: [{ name: 'name', label: 'Name', required: true }, { name: 'address', label: 'Address' }, { name: 'managerName', label: 'Manager Name' }] },
    {
      key: 'opening', label: 'Warehouse Opening', endpoint: '/openings', columns: ['warehouseName', 'itemName', 'openingQty', 'value', 'date'],
      formFields: [
        { name: 'warehouseId', label: 'Warehouse', type: 'select', optionsEndpoint: '/warehouse/dropdown/warehouses', optionsValue: 'id', optionsLabel: 'label' },
        { name: 'productId', label: 'Item Name', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'openingQty', label: 'Opening Qty', type: 'number', required: true },
        { name: 'value', label: 'Value', type: 'number', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
      ]
    },
    {
      key: 'dispatch-srv', label: 'Dispatch SRV', endpoint: '/dispatch-srv', columns: ['srvNo', 'date', 'partyName', 'itemName', 'qty', 'returnExpectedDate'], hasPrint: true, printType: 'warehouse-dispatch-srv',
      formFields: [
        { name: 'srvNo', label: 'SRV No' },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'partyName', label: 'Party Name', required: true },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'qty', label: 'Qty', type: 'number', required: true },
        { name: 'returnExpected', label: 'Return Expected', type: 'select', options: ['false', 'true'] },
        { name: 'returnExpectedDate', label: 'Return Expected Date', type: 'date' },
      ]
    },
    {
      key: 'transfers', label: 'Stock Transfer', endpoint: '/transfers', columns: ['transferId', 'fromWarehouse', 'toWarehouse', 'itemName', 'qty', 'status'], hasPrint: true, printType: 'warehouse-stock-transfer',
      formFields: [
        { name: 'transferId', label: 'Transfer ID' },
        { name: 'fromWarehouseId', label: 'From Warehouse', type: 'select', optionsEndpoint: '/warehouse/dropdown/warehouses', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'toWarehouseId', label: 'To Warehouse', type: 'select', optionsEndpoint: '/warehouse/dropdown/warehouses', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'qty', label: 'Qty', type: 'number', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Transferred', 'Pending'] },
      ]
    },
    {
      key: 'material-receipts', label: 'Material Receipt', endpoint: '/material-receipts', columns: ['receiptId', 'sourceDocRef', 'itemName', 'qtyReceived', 'receiptDate'], hasPrint: true, printType: 'warehouse-material-receipt',
      formFields: [
        { name: 'receiptId', label: 'Receipt ID' },
        { name: 'sourceDocRef', label: 'Source Doc Ref' },
        { name: 'warehouseId', label: 'Warehouse', type: 'select', optionsEndpoint: '/warehouse/dropdown/warehouses', optionsValue: 'id', optionsLabel: 'label' },
        { name: 'productId', label: 'Item', type: 'select', optionsEndpoint: '/warehouse/dropdown/products', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'qtyReceived', label: 'Qty Received', type: 'number', required: true },
        { name: 'receiptDate', label: 'Receipt Date', type: 'date', required: true },
      ]
    },
    { key: 'stocks', label: 'Stocks', endpoint: '/stocks', columns: ['warehouse.name', 'product.name', 'quantity', 'value'] },
  ]
};

const logisticsConfig = {
  title: 'Logistics', apiBase: '/logistics',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'transporters', label: 'Transporters', endpoint: '/transporters', columns: ['name', 'ownerName', 'mobile', 'gstin'], formFields: [{ name: 'name', label: 'Name', required: true }, { name: 'ownerName', label: 'Owner Name' }, { name: 'mobile', label: 'Mobile' }, { name: 'gstin', label: 'GSTIN' }] },
    { key: 'orders', label: 'Orders', endpoint: '/orders', columns: ['orderNo', 'transporter.name', 'destination', 'status'] },
    { key: 'bills', label: 'Freight Bills', endpoint: '/freight-bills', columns: ['billNo', 'lrNo', 'freightAmount', 'status'] },
  ]
};

const contractorsConfig = {
  title: 'Contractors HR', apiBase: '/contractors',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    {
      key: 'workers',
      label: 'Employee Master',
      endpoint: '/workers',
      columns: ['workerId', 'contractorFirmName', 'workerName', 'skillLevel', 'aadharNo'],
      formFields: [
        { name: 'workerId', label: 'Worker ID' },
        { name: 'vendorId', label: 'Contractor Firm Name', type: 'select', optionsEndpoint: '/contractors/dropdown/vendors', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'workerName', label: 'Worker Name', required: true },
        { name: 'skillLevel', label: 'Skill Level', type: 'select', options: ['Skilled', 'Unskilled'], required: true },
        { name: 'aadharNo', label: 'Aadhar No' },
      ]
    },
    {
      key: 'salary-heads',
      label: 'Salary Head Master',
      endpoint: '/salary-heads',
      columns: ['role', 'dailyRate', 'overtimeRate'],
      formFields: [
        { name: 'role', label: 'Role', required: true },
        { name: 'dailyRate', label: 'Daily Rate', type: 'number', required: true },
        { name: 'overtimeRate', label: 'Overtime Rate', type: 'number', required: true },
      ]
    },
    {
      key: 'salary-structures',
      label: 'Salary Structure',
      endpoint: '/salary-structures',
      columns: ['workerName', 'role', 'applicableDailyRate', 'overtimeRate'],
      formFields: [
        { name: 'workerId', label: 'Worker Name', type: 'select', optionsEndpoint: '/contractors/dropdown/workers', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'role', label: 'Role', required: true },
        { name: 'applicableDailyRate', label: 'Applicable Daily Rate', type: 'number', required: true },
        { name: 'overtimeRate', label: 'OT Rate', type: 'number', required: true },
      ]
    },
    {
      key: 'salary-sheets',
      label: 'Salary Sheet',
      endpoint: '/salary-sheets',
      columns: ['contractorName', 'month', 'workerName', 'daysWorked', 'overtimeHours', 'totalPayable'],
      hasPrint: true,
      printType: 'contractor-salary-sheet',
      formFields: [
        { name: 'vendorId', label: 'Contractor Name', type: 'select', optionsEndpoint: '/contractors/dropdown/vendors', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'workerId', label: 'Worker Name', type: 'select', optionsEndpoint: '/contractors/dropdown/workers', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'month', label: 'Month', required: true },
        { name: 'year', label: 'Year', type: 'number', required: true },
        { name: 'daysWorked', label: 'Days Worked', type: 'number', required: true },
        { name: 'overtimeHours', label: 'Overtime Hours', type: 'number', required: true },
        { name: 'dailyRate', label: 'Daily Rate', type: 'number' },
        { name: 'overtimeRate', label: 'OT Rate', type: 'number' },
      ]
    },
    {
      key: 'advances',
      label: 'Advance Memo',
      endpoint: '/advances',
      columns: ['contractorName', 'date', 'amount', 'remarks'],
      hasPrint: true,
      printType: 'contractor-advance-memo',
      formFields: [
        { name: 'vendorId', label: 'Contractor Name', type: 'select', optionsEndpoint: '/contractors/dropdown/vendors', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'remarks', label: 'Remarks' },
      ]
    },
    {
      key: 'voucher-payments',
      label: 'Voucher Payment',
      endpoint: '/voucher-payments',
      columns: ['voucherNo', 'contractorName', 'salarySheetId', 'netAmountPaid', 'tdsDeducted'],
      hasPrint: true,
      printType: 'contractor-voucher-payment',
      formFields: [
        { name: 'voucherNo', label: 'Voucher No' },
        { name: 'vendorId', label: 'Contractor Name', type: 'select', optionsEndpoint: '/contractors/dropdown/vendors', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'salarySheetId', label: 'Salary Sheet Ref', type: 'number' },
        { name: 'netAmountPaid', label: 'Net Amount Paid', type: 'number', required: true },
        { name: 'tdsDeducted', label: 'TDS Deducted', type: 'number', required: true },
        { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
      ]
    },
  ]
};

const maintenanceConfig = {
  title: 'Maintenance', apiBase: '/maintenance',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    {
      key: 'tools', label: 'Tool Master', endpoint: '/tools', columns: ['assetCode', 'toolName', 'location', 'maintenanceIntervalDays'],
      formFields: [
        { name: 'assetCode', label: 'Asset Code' },
        { name: 'toolName', label: 'Tool Name', required: true },
        { name: 'location', label: 'Location' },
        { name: 'maintenanceIntervalDays', label: 'Maintenance Interval (Days)', type: 'number', required: true },
      ]
    },
    {
      key: 'charts', label: 'Tool Maintenance Chart', endpoint: '/maintenance-charts', columns: ['toolName', 'scheduledDate', 'taskList', 'status'],
      formFields: [
        { name: 'toolId', label: 'Tool Ref', type: 'select', optionsEndpoint: '/maintenance/dropdown/tools', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
        { name: 'taskList', label: 'Task List', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed'] },
      ]
    },
    {
      key: 'calibration', label: 'Tool Calibration Report', endpoint: '/calibration', columns: ['toolName', 'calibrationDate', 'standardValue', 'actualValue', 'result'], hasPrint: true, printType: 'maintenance-calibration',
      formFields: [
        { name: 'toolId', label: 'Tool Ref', type: 'select', optionsEndpoint: '/maintenance/dropdown/tools', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'calibrationDate', label: 'Calibration Date', type: 'date', required: true },
        { name: 'standardValue', label: 'Standard Value', type: 'number', required: true },
        { name: 'actualValue', label: 'Actual Value', type: 'number', required: true },
        { name: 'result', label: 'Result', type: 'select', options: ['Pass', 'Fail'], required: true },
      ]
    },
    {
      key: 'rectification', label: 'Rectification Memo', endpoint: '/rectification', columns: ['jobId', 'toolName', 'issue', 'cost', 'technician'], hasPrint: true, printType: 'maintenance-rectification',
      formFields: [
        { name: 'jobId', label: 'Job ID' },
        { name: 'toolId', label: 'Tool Ref', type: 'select', optionsEndpoint: '/maintenance/dropdown/tools', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'issue', label: 'Issue', required: true },
        { name: 'sparesUsed', label: 'Spares Used' },
        { name: 'cost', label: 'Cost', type: 'number', required: true },
        { name: 'technician', label: 'Technician' },
        { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
      ]
    },
  ]
};

const assetsConfig = {
  title: 'Asset Management', apiBase: '/assets',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    {
      key: 'assets',
      label: 'Fixed Asset Master',
      endpoint: '',
      columns: ['assetTag', 'name', 'assetGroup', 'purchaseDate', 'value', 'currentValue'],
      formFields: [
        { name: 'assetTag', label: 'Asset Tag' },
        { name: 'name', label: 'Name', required: true },
        { name: 'assetGroup', label: 'Group', type: 'select', options: ['IT', 'Plant', 'Furniture'], required: true },
        { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
        { name: 'value', label: 'Value', type: 'number', required: true },
        { name: 'depreciationRate', label: 'Depreciation Rate', type: 'number' },
      ]
    },
    {
      key: 'addition-memos',
      label: 'Asset Addition Memo',
      endpoint: '/addition-memos',
      columns: ['assetTag', 'invoiceRef', 'installationDate', 'depreciationRate'],
      hasPrint: true,
      printType: 'asset-addition-memo',
      formFields: [
        { name: 'assetId', label: 'Asset Ref', type: 'select', optionsEndpoint: '/assets/dropdown/assets', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'invoiceRef', label: 'Invoice Ref', required: true },
        { name: 'installationDate', label: 'Installation Date', type: 'date', required: true },
        { name: 'depreciationRate', label: 'Depreciation Rate', type: 'number', required: true },
      ]
    },
    {
      key: 'allocations',
      label: 'Asset Allocation Master',
      endpoint: '/allocations',
      columns: ['assetTag', 'employeeName', 'department', 'dateAssigned'],
      hasPrint: true,
      printType: 'asset-allocation',
      formFields: [
        { name: 'assetId', label: 'Asset Tag', type: 'select', optionsEndpoint: '/assets/dropdown/assets', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'employeeName', label: 'Employee Name', required: true },
        { name: 'department', label: 'Department', required: true },
        { name: 'dateAssigned', label: 'Date Assigned', type: 'date', required: true },
      ]
    },
    {
      key: 'sale-memos',
      label: 'Asset Sale Memo',
      endpoint: '/sale-memos',
      columns: ['assetTag', 'saleDate', 'saleValue', 'bookValue'],
      hasPrint: true,
      printType: 'asset-sale-memo',
      formFields: [
        { name: 'assetId', label: 'Asset Tag', type: 'select', optionsEndpoint: '/assets/dropdown/assets', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'saleDate', label: 'Sale Date', type: 'date', required: true },
        { name: 'saleValue', label: 'Sale Value', type: 'number', required: true },
        { name: 'bookValue', label: 'Book Value', type: 'number', required: true },
      ]
    },
    {
      key: 'depreciation-vouchers',
      label: 'Asset Depreciation Voucher',
      endpoint: '/depreciation-vouchers',
      columns: ['year', 'assetTag', 'openingBalance', 'depreciationAmount', 'closingBalance'],
      hasPrint: true,
      printType: 'asset-depreciation-voucher',
      formFields: [
        { name: 'year', label: 'Year', type: 'number', required: true },
        { name: 'assetId', label: 'Asset Tag', type: 'select', optionsEndpoint: '/assets/dropdown/assets', optionsValue: 'id', optionsLabel: 'label', required: true },
        { name: 'openingBalance', label: 'Opening Balance', type: 'number', required: true },
        { name: 'depreciationAmount', label: 'Depreciation Amount', type: 'number', required: true },
        { name: 'closingBalance', label: 'Closing Balance', type: 'number' },
      ]
    },
  ]
};

const statutoryConfig = {
  title: 'Statutory / GST', apiBase: '/statutory',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'gst', label: 'GST Master', endpoint: '/gst-master', columns: ['hsnCode', 'description', 'igstPercent', 'cgstPercent', 'sgstPercent'], formFields: [{ name: 'hsnCode', label: 'HSN Code', required: true }, { name: 'description', label: 'Description' }, { name: 'igstPercent', label: 'IGST %', type: 'number' }, { name: 'cgstPercent', label: 'CGST %', type: 'number' }, { name: 'sgstPercent', label: 'SGST %', type: 'number' }] },
    { key: 'gstr1', label: 'GSTR-1', endpoint: '/gstr1', columns: ['month', 'invoiceNo', 'customerGSTIN', 'taxableValue', 'taxAmount'] },
    { key: 'tds', label: 'TDS', endpoint: '/tds', columns: ['section', 'deducteeName', 'paymentAmount', 'tdsRate', 'tdsAmount'] },
    { key: 'challans', label: 'Challans', endpoint: '/challans', columns: ['challanNo', 'taxType', 'amount', 'bankName'] },
    { key: 'cheques', label: 'Cheque Books', endpoint: '/cheque-books', columns: ['bankAccount', 'startLeafNo', 'endLeafNo'] },
  ]
};

export default function App() {
  return (
    <BrowserRouter>
      <TopProgressBar />
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155' },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
      }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/print/:type/:id" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchase" element={<GenericModulePage {...purchaseConfig} />} />
          <Route path="production" element={<GenericModulePage {...productionConfig} />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="finance" element={<GenericModulePage {...financeConfig} />} />
          <Route path="hr" element={<GenericModulePage {...hrConfig} />} />
          <Route path="quality" element={<GenericModulePage {...qualityConfig} />} />
          <Route path="warehouse" element={<GenericModulePage {...warehouseConfig} />} />
          <Route path="statutory" element={<GenericModulePage {...statutoryConfig} />} />
          <Route path="logistics" element={<GenericModulePage {...logisticsConfig} />} />
          <Route path="contractors" element={<GenericModulePage {...contractorsConfig} />} />
          <Route path="maintenance" element={<GenericModulePage {...maintenanceConfig} />} />
          <Route path="assets" element={<GenericModulePage {...assetsConfig} />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Profiles */}
          <Route path="profile/customer/:id" element={<CustomerProfilePage />} />
          <Route path="profile/vendor/:id" element={<VendorProfilePage />} />
          <Route path="profile/employee/:id" element={<EmployeeProfilePage />} />
          <Route path="profile/salesman/:id" element={<SalesmanProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
