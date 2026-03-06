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
    }
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
        </div>
    );
}
