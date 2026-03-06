import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../lib/api';
import '../components/print/PrintPage.css';
import InvoiceTemplate from '../components/print/InvoiceTemplate';
import QuotationTemplate from '../components/print/QuotationTemplate';
import VoucherJournalTemplate from '../components/print/VoucherJournalTemplate';
import VoucherPaymentReceiptTemplate from '../components/print/VoucherPaymentReceiptTemplate';
import VoucherContraTemplate from '../components/print/VoucherContraTemplate';
import VoucherGSTTemplate from '../components/print/VoucherGSTTemplate';
import BankReconciliationTemplate from '../components/print/BankReconciliationTemplate';
import CreditCardStatementTemplate from '../components/print/CreditCardStatementTemplate';
import SalesReceiptTemplate from '../components/print/SalesReceiptTemplate';
import PurchaseOrderTemplate from '../components/print/PurchaseOrderTemplate';
import GRNTemplate from '../components/print/GRNTemplate';
import PurchaseBillTemplate from '../components/print/PurchaseBillTemplate';
import GenericDocumentTemplate from '../components/print/GenericDocumentTemplate';

const endpointMap = {
    invoice: (id) => `/sales/invoices/${id}`,
    quotation: (id) => `/sales/quotations/${id}`,
    receipt: (id) => `/sales/receipts/${id}`,
    'purchase-order': (id) => `/purchase/purchase-orders/${id}`,
    grn: (id) => `/purchase/grns/${id}`,
    'purchase-bill': (id) => `/purchase/bills/${id}`,
    'voucher-journal': (id) => `/finance/voucher-journals/${id}`,
    'voucher-payment-receipt': (id) => `/finance/voucher-payment-receipts/${id}`,
    'voucher-contra': (id) => `/finance/voucher-contras/${id}`,
    'voucher-gst': (id) => `/finance/voucher-gsts/${id}`,
    'bank-reconciliation': (id) => `/finance/bank-reconciliations/${id}`,
    'credit-card-statement': (id) => `/finance/credit-card-statements/${id}`,
    'quality-iqc': (id) => `/quality/iqc/${id}`,
    'quality-mts': (id) => `/quality/mts/${id}`,
    'quality-pqc': (id) => `/quality/pqc/${id}`,
    'quality-pdi': (id) => `/quality/pdi/${id}`,
    'quality-qrd': (id) => `/quality/qrd/${id}`,
    'contractor-salary-sheet': (id) => `/contractors/salary-sheets/${id}`,
    'contractor-advance-memo': (id) => `/contractors/advances/${id}`,
    'contractor-voucher-payment': (id) => `/contractors/voucher-payments/${id}`,
    'maintenance-calibration': (id) => `/maintenance/calibration/${id}`,
    'maintenance-rectification': (id) => `/maintenance/rectification/${id}`,
    'warehouse-dispatch-srv': (id) => `/warehouse/dispatch-srv/${id}`,
    'warehouse-stock-transfer': (id) => `/warehouse/transfers/${id}`,
    'warehouse-material-receipt': (id) => `/warehouse/material-receipts/${id}`,
    'asset-addition-memo': (id) => `/assets/addition-memos/${id}`,
    'asset-allocation': (id) => `/assets/allocations/${id}`,
    'asset-sale-memo': (id) => `/assets/sale-memos/${id}`,
    'asset-depreciation-voucher': (id) => `/assets/depreciation-vouchers/${id}`,
};

const fallbackData = {
    'voucher-journal': {
        journalNo: 'JV-202603-0010',
        date: new Date().toISOString(),
        debitAccount: 'Office Expense',
        creditAccount: 'Cash',
        amount: 12500,
        narration: 'Sample journal entry generated for printing preview.'
    },
    'voucher-payment-receipt': {
        voucherNo: 'PV-202603-0005',
        voucherType: 'Payment',
        date: new Date().toISOString(),
        partyName: 'ABC Suppliers Pvt Ltd',
        amount: 18450,
        mode: 'Bank',
        referenceNo: 'UTR0987654321',
        remarks: 'Sample payment voucher for print preview.'
    },
    'voucher-contra': {
        voucherNo: 'CV-202603-0003',
        date: new Date().toISOString(),
        fromAccount: 'Cash in Hand',
        toAccount: 'SBI Current Account',
        amount: 50000,
        remarks: 'Cash deposited to bank (sample data).'
    },
    'voucher-gst': {
        voucherNo: 'GV-202603-0002',
        date: new Date().toISOString(),
        gstLedger: 'Input',
        adjustmentType: 'Adjustment',
        amount: 7800,
        remarks: 'GST input adjustment sample record.'
    },
    'bank-reconciliation': {
        bankAccount: 'SBI Current Account - 12345678901',
        statementDate: new Date().toISOString(),
        systemBalance: 543210.15,
        bankBalance: 541000,
        unreconciledAmt: 2210.15,
        status: 'Pending'
    },
    'credit-card-statement': {
        cardNo: '4545454545451234',
        statementMonth: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        transactionDate: new Date().toISOString(),
        merchant: 'Adobe Systems',
        description: 'Annual software subscription (sample)',
        amount: 12999
    },
    receipt: {
        receiptNo: 'RV-202603-0001',
        receiptDate: new Date().toISOString(),
        amount: 25000,
        paymentMode: 'Bank',
        remarks: 'Sample receipt for testing print output.',
        customer: {
            name: 'Tata Motors Ltd',
            address: 'Pimpri, Pune',
            city: 'Pune',
            state: 'Maharashtra'
        },
        invoice: { invoiceNo: 'INV-001' }
    },
    'purchase-order': {
        poNo: 'PO-001',
        poDate: new Date().toISOString(),
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalAmount: 50150,
        status: 'Approved',
        vendor: {
            name: 'SteelCorp Industries',
            address: 'Industrial Estate, Ahmedabad',
            city: 'Ahmedabad',
            state: 'Gujarat',
            gstin: '24AABCS1234D1Z5'
        },
        items: [
            { productId: 1, quantity: 500, rate: 85, gstPercent: 18, total: 50150 }
        ]
    },
    grn: {
        grnNo: 'GRN-001',
        grnDate: new Date().toISOString(),
        challanNo: 'CH-2026-45',
        status: 'Received',
        vendor: {
            name: 'SteelCorp Industries',
            address: 'Industrial Estate, Ahmedabad'
        },
        items: [
            { productId: 1, quantity: 500, acceptedQty: 495, rejectedQty: 5 }
        ]
    },
    'purchase-bill': {
        billNo: 'PB-001',
        vendorInvoiceNo: 'V-8891',
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        taxableValue: 42500,
        cgstAmount: 3825,
        sgstAmount: 3825,
        igstAmount: 0,
        grandTotal: 50150,
        status: 'Unpaid',
        vendor: {
            name: 'SteelCorp Industries',
            address: 'Industrial Estate, Ahmedabad',
            gstin: '24AABCS1234D1Z5'
        }
    },
    'quality-iqc': { grnRef: 'GRN-001', item: 'Steel Sheet 1.2mm', sampleQty: 25, visualCheck: 'Pass', dimensionCheck: 'Pass', status: 'Pass', inspectionDate: new Date().toISOString() },
    'quality-mts': { mtaRef: 'MTA-001', item: 'Steel Rod 10mm', qtyChecked: 80, status: 'OK', remarks: 'No transit damage found.' },
    'quality-pqc': { routeCardRef: 'RC-1023', stageName: 'Machining', operator: 'Ravi Kumar', observations: 'Tolerance within limits', status: 'Closed' },
    'quality-pdi': { soRef: 'SO-2026-010', boxNo: 'BX-12', packagingCondition: 'Good', labelAccuracy: 'Accurate', overallResult: 'Pass' },
    'quality-qrd': { rejectionId: 'QRD-0004', item: 'Copper Wire 2.5mm', qty: 40, action: 'Rework', remarks: 'Insulation mismatch' },
    'contractor-salary-sheet': { contractorName: 'Steel Authority of India', month: 'March', year: 2026, workerName: 'Contract Worker-01', daysWorked: 24, overtimeHours: 10, totalPayable: 16200 },
    'contractor-advance-memo': { contractorName: 'Steel Authority of India', date: new Date().toISOString(), amount: 35000, remarks: 'Festival advance' },
    'contractor-voucher-payment': { voucherNo: 'CVP-0003', contractorName: 'Steel Authority of India', salarySheetId: 1, netAmountPaid: 15400, tdsDeducted: 800, paymentDate: new Date().toISOString() },
    'maintenance-calibration': { toolName: 'Torque Wrench', calibrationDate: new Date().toISOString(), standardValue: 50, actualValue: 49.8, result: 'Pass' },
    'maintenance-rectification': { jobId: 'JOB-0082', toolName: 'Hydraulic Press', issue: 'Oil leakage', sparesUsed: 'Seal kit', cost: 2800, technician: 'Mahesh' },
    'warehouse-dispatch-srv': { srvNo: 'SRV-0011', date: new Date().toISOString(), partyName: 'ABC Tools', itemName: 'Hex Bolt M10', qty: 1000, returnExpectedDate: new Date().toISOString() },
    'warehouse-stock-transfer': { transferId: 'WST-0022', fromWarehouse: 'Main Store', toWarehouse: 'Production Store', itemName: 'Rubber Sheet 5mm', qty: 120, status: 'Transferred' },
    'warehouse-material-receipt': { receiptId: 'WMR-0030', sourceDocRef: 'WST-0022', itemName: 'Rubber Sheet 5mm', qtyReceived: 120, receiptDate: new Date().toISOString() },
    'asset-addition-memo': { assetTag: 'AST-1001', assetName: 'Laptop Dell', invoiceRef: 'INV-AS-22', installationDate: new Date().toISOString(), depreciationRate: 25 },
    'asset-allocation': { assetTag: 'AST-1001', assetName: 'Laptop Dell', employeeName: 'Amit Kumar', department: 'Production', dateAssigned: new Date().toISOString() },
    'asset-sale-memo': { assetTag: 'AST-0902', assetName: 'Laser Printer', saleDate: new Date().toISOString(), saleValue: 15000, bookValue: 12000 },
    'asset-depreciation-voucher': { year: 2026, assetTag: 'AST-1001', assetName: 'Laptop Dell', openingBalance: 60000, depreciationAmount: 15000, closingBalance: 45000 }
};

const genericPrintConfigs = {
    'quality-iqc': { title: 'IQC (Incoming) Report', fields: [{ key: 'grnRef', label: 'GRN Ref' }, { key: 'item', label: 'Item' }, { key: 'sampleQty', label: 'Sample Qty' }, { key: 'visualCheck', label: 'Visual Check' }, { key: 'dimensionCheck', label: 'Dimension Check' }, { key: 'status', label: 'Status' }, { key: 'inspectionDate', label: 'Inspection Date' }] },
    'quality-mts': { title: 'Material Transfer Slip Check', fields: [{ key: 'mtaRef', label: 'MTA Ref' }, { key: 'item', label: 'Item' }, { key: 'qtyChecked', label: 'Qty Checked' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }] },
    'quality-pqc': { title: 'Process Quality Control', fields: [{ key: 'routeCardRef', label: 'Route Card Ref' }, { key: 'stageName', label: 'Stage Name' }, { key: 'operator', label: 'Operator' }, { key: 'observations', label: 'Observations' }, { key: 'status', label: 'Status' }] },
    'quality-pdi': { title: 'Pre-Dispatch Inspection', fields: [{ key: 'soRef', label: 'SO Ref' }, { key: 'boxNo', label: 'Box No' }, { key: 'packagingCondition', label: 'Packaging Condition' }, { key: 'labelAccuracy', label: 'Label Accuracy' }, { key: 'overallResult', label: 'Overall Result' }] },
    'quality-qrd': { title: 'Quality Rejection Decision', fields: [{ key: 'rejectionId', label: 'Rejection ID' }, { key: 'item', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'action', label: 'Action' }, { key: 'remarks', label: 'Remarks' }] },
    'contractor-salary-sheet': { title: 'Contractor Salary Sheet', fields: [{ key: 'contractorName', label: 'Contractor Name' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Year' }, { key: 'workerName', label: 'Worker Name' }, { key: 'daysWorked', label: 'Days Worked' }, { key: 'overtimeHours', label: 'Overtime Hours' }, { key: 'totalPayable', label: 'Total Payable' }] },
    'contractor-advance-memo': { title: 'Contractor Advance Memo', fields: [{ key: 'contractorName', label: 'Contractor Name' }, { key: 'date', label: 'Date' }, { key: 'amount', label: 'Amount' }, { key: 'remarks', label: 'Remarks' }] },
    'contractor-voucher-payment': { title: 'Contractor Voucher Payment', fields: [{ key: 'voucherNo', label: 'Voucher No' }, { key: 'contractorName', label: 'Contractor Name' }, { key: 'salarySheetId', label: 'Salary Sheet Ref' }, { key: 'netAmountPaid', label: 'Net Amount Paid' }, { key: 'tdsDeducted', label: 'TDS Deducted' }, { key: 'paymentDate', label: 'Payment Date' }] },
    'maintenance-calibration': { title: 'Tool Calibration Report', fields: [{ key: 'toolName', label: 'Tool Ref' }, { key: 'calibrationDate', label: 'Calibration Date' }, { key: 'standardValue', label: 'Standard Value' }, { key: 'actualValue', label: 'Actual Value' }, { key: 'result', label: 'Result' }] },
    'maintenance-rectification': { title: 'Tool Maintenance / Rectification Memo', fields: [{ key: 'jobId', label: 'Job ID' }, { key: 'toolName', label: 'Tool Ref' }, { key: 'issue', label: 'Issue' }, { key: 'sparesUsed', label: 'Spares Used' }, { key: 'cost', label: 'Cost' }, { key: 'technician', label: 'Technician' }] },
    'warehouse-dispatch-srv': { title: 'Dispatch SRV', fields: [{ key: 'srvNo', label: 'SRV No' }, { key: 'date', label: 'Date' }, { key: 'partyName', label: 'Party Name' }, { key: 'itemName', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'returnExpectedDate', label: 'Return Expected Date' }] },
    'warehouse-stock-transfer': { title: 'Warehouse Stock Transfer', fields: [{ key: 'transferId', label: 'Transfer ID' }, { key: 'fromWarehouse', label: 'From Warehouse' }, { key: 'toWarehouse', label: 'To Warehouse' }, { key: 'itemName', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }] },
    'warehouse-material-receipt': { title: 'Warehouse Material Receipt', fields: [{ key: 'receiptId', label: 'Receipt ID' }, { key: 'sourceDocRef', label: 'Source Doc Ref' }, { key: 'itemName', label: 'Item' }, { key: 'qtyReceived', label: 'Qty Received' }, { key: 'receiptDate', label: 'Receipt Date' }] },
    'asset-addition-memo': { title: 'Asset Addition Memo', fields: [{ key: 'assetTag', label: 'Asset Ref' }, { key: 'assetName', label: 'Asset Name' }, { key: 'invoiceRef', label: 'Invoice Ref' }, { key: 'installationDate', label: 'Installation Date' }, { key: 'depreciationRate', label: 'Depreciation Rate' }] },
    'asset-allocation': { title: 'Asset Allocation Master', fields: [{ key: 'assetTag', label: 'Asset Tag' }, { key: 'assetName', label: 'Asset Name' }, { key: 'employeeName', label: 'Employee Name' }, { key: 'department', label: 'Department' }, { key: 'dateAssigned', label: 'Date Assigned' }] },
    'asset-sale-memo': { title: 'Asset Sale Memo', fields: [{ key: 'assetTag', label: 'Asset Tag' }, { key: 'assetName', label: 'Asset Name' }, { key: 'saleDate', label: 'Sale Date' }, { key: 'saleValue', label: 'Sale Value' }, { key: 'bookValue', label: 'Book Value' }] },
    'asset-depreciation-voucher': { title: 'Asset Depreciation Voucher', fields: [{ key: 'year', label: 'Year' }, { key: 'assetTag', label: 'Asset Tag' }, { key: 'assetName', label: 'Asset Name' }, { key: 'openingBalance', label: 'Opening Balance' }, { key: 'depreciationAmount', label: 'Depreciation Amount' }, { key: 'closingBalance', label: 'Closing Balance' }] },
};

export default function PrintPage() {
    const { type, id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const endpointBuilder = endpointMap[type];
                if (!endpointBuilder) throw new Error('Invalid print document type');

                const endpoint = endpointBuilder(id);

                const res = await api.get(endpoint);
                setData(res.data.data);

                // Allow network images to load, then trigger print dialog
                setTimeout(() => {
                    window.print();
                }, 800);
            } catch (err) {
                console.error(err);
                if (fallbackData[type]) {
                    setData(fallbackData[type]);
                } else {
                    setError('Failed to load document for printing');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) loadData();
    }, [type, id]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading document...</div>;
    if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
    if (!data) return <Navigate to="/" />;

    // Render the appropriate template
    return (
        <div className="print-container">
            {type === 'invoice' && <InvoiceTemplate data={data} />}
            {type === 'quotation' && <QuotationTemplate data={data} />}
            {type === 'voucher-journal' && <VoucherJournalTemplate data={data} />}
            {type === 'voucher-payment-receipt' && <VoucherPaymentReceiptTemplate data={data} />}
            {type === 'voucher-contra' && <VoucherContraTemplate data={data} />}
            {type === 'voucher-gst' && <VoucherGSTTemplate data={data} />}
            {type === 'bank-reconciliation' && <BankReconciliationTemplate data={data} />}
            {type === 'credit-card-statement' && <CreditCardStatementTemplate data={data} />}
            {type === 'receipt' && <SalesReceiptTemplate data={data} />}
            {type === 'purchase-order' && <PurchaseOrderTemplate data={data} />}
            {type === 'grn' && <GRNTemplate data={data} />}
            {type === 'purchase-bill' && <PurchaseBillTemplate data={data} />}
            {genericPrintConfigs[type] && <GenericDocumentTemplate title={genericPrintConfigs[type].title} data={data} fields={genericPrintConfigs[type].fields} />}
        </div>
    );
}
