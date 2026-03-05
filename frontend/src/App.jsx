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
    { key: 'pos', label: 'Purchase Orders', endpoint: '/purchase-orders', columns: ['poNo', 'vendor.name', 'totalAmount', 'status'] },
    { key: 'grns', label: 'GRNs', endpoint: '/grns', columns: ['grnNo', 'vendor.name', 'status'] },
    { key: 'bills', label: 'Bills', endpoint: '/bills', columns: ['billNo', 'vendor.name', 'totalAmount', 'status'] },
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
    { key: 'vouchers', label: 'Vouchers', endpoint: '/vouchers', columns: ['voucherNo', 'voucherType', 'debitAccount', 'creditAccount', 'amount'], formFields: [{ name: 'voucherType', label: 'Type' }, { name: 'debitAccount', label: 'Debit Account', required: true }, { name: 'creditAccount', label: 'Credit Account', required: true }, { name: 'amount', label: 'Amount', type: 'number', required: true }, { name: 'narration', label: 'Narration' }] },
    { key: 'recon', label: 'Bank Reconciliation', endpoint: '/bank-reconciliation', columns: ['bankAccount', 'statementDate', 'systemBalance', 'bankBalance', 'status'] },
    { key: 'cc', label: 'Credit Card', endpoint: '/credit-card', columns: ['cardNo', 'statementMonth', 'merchant', 'amount'] },
  ]
};

const hrConfig = {
  title: 'HR Management', apiBase: '/hr',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'employees', label: 'Employees', endpoint: '/employees', columns: ['empCode', 'name', 'designation', 'department', 'basicSalary'], formFields: [{ name: 'empCode', label: 'Emp Code', required: true }, { name: 'name', label: 'Name', required: true }, { name: 'designation', label: 'Designation' }, { name: 'department', label: 'Department' }, { name: 'mobile', label: 'Mobile' }, { name: 'basicSalary', label: 'Basic Salary', type: 'number' }] },
    { key: 'salarysheets', label: 'Salary Sheets', endpoint: '/salary-sheets', columns: ['employee.name', 'month', 'year', 'grossSalary', 'netPay', 'status'] },
  ]
};

const qualityConfig = {
  title: 'Quality Management', apiBase: '/quality',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'iqc', label: 'IQC', endpoint: '/iqc', columns: ['grnId', 'totalQty', 'acceptedQty', 'rejectedQty', 'status'] },
    { key: 'pqc', label: 'PQC', endpoint: '/pqc', columns: ['routeCardRef', 'stageName', 'operatorName', 'result'] },
    { key: 'pdi', label: 'PDI', endpoint: '/pdi', columns: ['soRef', 'boxNo', 'overallResult'] },
    { key: 'qrd', label: 'QRD', endpoint: '/qrd', columns: ['rejectionId', 'itemName', 'quantity', 'action'] },
  ]
};

const warehouseConfig = {
  title: 'Warehouse Management', apiBase: '/warehouse',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'warehouses', label: 'Warehouses', endpoint: '/warehouses', columns: ['name', 'address', 'managerName'], formFields: [{ name: 'name', label: 'Name', required: true }, { name: 'address', label: 'Address' }, { name: 'managerName', label: 'Manager Name' }] },
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
    { key: 'workers', label: 'Workers', endpoint: '/workers', columns: ['workerId', 'workerName', 'contractorFirm', 'skillLevel'], formFields: [{ name: 'workerId', label: 'Worker ID', required: true }, { name: 'workerName', label: 'Name', required: true }, { name: 'contractorFirm', label: 'Contractor Firm' }, { name: 'skillLevel', label: 'Skill Level' }] },
    { key: 'sheets', label: 'Salary Sheets', endpoint: '/salary-sheets', columns: ['worker.workerName', 'month', 'year', 'daysWorked', 'netPayable'] },
  ]
};

const maintenanceConfig = {
  title: 'Maintenance', apiBase: '/maintenance',
  tabs: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'tools', label: 'Tools', endpoint: '/tools', columns: ['assetCode', 'toolName', 'location', 'maintenanceInterval'], formFields: [{ name: 'assetCode', label: 'Asset Code', required: true }, { name: 'toolName', label: 'Tool Name', required: true }, { name: 'location', label: 'Location' }, { name: 'maintenanceInterval', label: 'Maintenance Interval (days)', type: 'number' }] },
    { key: 'charts', label: 'Maintenance Charts', endpoint: '/maintenance-charts', columns: ['tool.toolName', 'scheduledDate', 'status'] },
    { key: 'calibration', label: 'Calibration', endpoint: '/calibration', columns: ['tool.toolName', 'calibrationDate', 'result'] },
  ]
};

const assetsConfig = {
  title: 'Asset Management', apiBase: '/assets',
  tabs: [
    { key: 'assets', label: 'Assets', endpoint: '/', columns: ['assetTag', 'name', 'assetGroup', 'purchaseValue', 'currentValue', 'depreciationRate'], formFields: [{ name: 'assetTag', label: 'Asset Tag', required: true }, { name: 'name', label: 'Name', required: true }, { name: 'assetGroup', label: 'Group' }, { name: 'purchaseValue', label: 'Purchase Value', type: 'number' }, { name: 'depreciationRate', label: 'Depreciation Rate %', type: 'number' }] },
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
