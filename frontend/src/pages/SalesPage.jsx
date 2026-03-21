import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, ShoppingCart, FileText, DollarSign, AlertTriangle, CheckCircle, XCircle, Truck, Printer, Send, Phone, Mail } from 'lucide-react';
import api from '../lib/api';
import { openEmailDraftOptions } from '../lib/emailDraft';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import RecordViewPanel from '../components/RecordViewPanel';
import RecordEditModal from '../components/RecordEditModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProfileLink from '../components/ProfileLink';
import SalesDashboard, { formatLakh } from '../components/SalesDashboard';
import useAuthStore from '../lib/auth';
import ModuleAIAssistant from '../components/ModuleAIAssistant';

const statusClass = (s) => {
    const map = { New: 'badge-new', Processing: 'badge-processing', Quoted: 'badge-active', Lost: 'badge-overdue', Draft: 'badge-draft', Sent: 'badge-active', Accepted: 'badge-completed', Rejected: 'badge-rejected', Pending: 'badge-pending', Dispatched: 'badge-active', Closed: 'badge-closed', Unpaid: 'badge-pending', Partial: 'badge-partial', Paid: 'badge-paid', Overdue: 'badge-overdue', 'Due Today': 'badge-overdue', Upcoming: 'badge-active' };
    return map[s] || 'badge-draft';
};

// ─── Per-tab configuration ────────────────────────────────────────────────────
const TAB_CONFIG = {
    customers: {
        endpoint: '/sales/customers',
        label: 'Customer',
        columns: ['name', 'gstin', 'city', 'state', 'contactPerson', 'phone'],
        viewFields: [
            { key: 'name', label: 'Name' }, { key: 'gstin', label: 'GSTIN' },
            { key: 'address', label: 'Address' }, { key: 'city', label: 'City' },
            { key: 'state', label: 'State' }, { key: 'pincode', label: 'Pincode' },
            { key: 'contactPerson', label: 'Contact Person' }, { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' }, { key: 'creditPeriod', label: 'Credit Period (days)' },
            { key: 'isActive', label: 'Active' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'name', label: 'Name', required: true, fullWidth: true },
            { name: 'gstin', label: 'GSTIN' }, { name: 'stateCode', label: 'State Code' },
            { name: 'address', label: 'Address', fullWidth: true },
            { name: 'city', label: 'City' }, { name: 'state', label: 'State' },
            { name: 'pincode', label: 'Pincode' }, { name: 'contactPerson', label: 'Contact Person' },
            { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email' },
            { name: 'creditPeriod', label: 'Credit Period (days)', type: 'number' },
        ],
        formFields: [
            { name: 'name', label: 'Name', required: true },
            { name: 'gstin', label: 'GSTIN' }, { name: 'stateCode', label: 'State Code' },
            { name: 'address', label: 'Address' }, { name: 'city', label: 'City' },
            { name: 'state', label: 'State' }, { name: 'contactPerson', label: 'Contact Person' },
            { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email' },
            { name: 'creditPeriod', label: 'Credit Period (days)', type: 'number' },
        ],
        deletePermission: 'sales.customer.delete',
    },
    inquiries: {
        endpoint: '/sales/inquiries',
        label: 'Inquiry',
        columns: ['inquiryNo', 'customer.name', 'salesPerson', 'status'],
        viewFields: [
            { key: 'inquiryNo', label: 'Inquiry No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'salesPerson', label: 'Sales Person' }, { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'remarks', label: 'Remarks' }, { key: 'inquiryDate', label: 'Date' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'salesPerson', label: 'Sales Person' }, { name: 'remarks', label: 'Remarks' },
            { name: 'status', label: 'Status', type: 'select', options: ['New', 'Processing', 'Quoted', 'Lost'] },
        ],
        formFields: [
            { name: 'customerId', label: 'Customer', type: 'dropdown', dropdownKey: 'customers', required: true },
            { name: 'salesPerson', label: 'Sales Person' }, { name: 'remarks', label: 'Remarks' },
        ],
        deletePermission: 'sales.inquiry.delete',
        hasItems: true,
        statusActions: [{ label: 'Mark Lost', status: 'Lost', confirmMessage: 'Mark this inquiry as Lost?', icon: XCircle, class: 'btn-danger' }],
    },
    quotations: {
        endpoint: '/sales/quotations',
        label: 'Quotation',
        columns: ['quoteNo', 'customer.name', 'totalAmount', 'status'],
        viewFields: [
            { key: 'quoteNo', label: 'Quote No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'totalAmount', label: 'Total Amount', render: r => formatLakh(r.totalAmount) },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'validUntil', label: 'Valid Until' }, { key: 'paymentTerms', label: 'Payment Terms' },
            { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'paymentTerms', label: 'Payment Terms' },
            { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Accepted', 'Rejected'] },
            { name: 'validUntil', label: 'Valid Until', type: 'date' },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => formatLakh(r.rate) }, { key: 'total', label: 'Total', render: r => formatLakh(r.total) }] }],
        formFields: [
            { name: 'inquiryId', label: 'Inquiry', type: 'dropdown', dropdownKey: 'inquiries', dropdownParams: '?status=Quoted', autoFill: 'inquiry' },
            { name: 'customerId', label: 'Customer', type: 'dropdown', dropdownKey: 'customers', required: true },
            { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
            { name: 'paymentTerms', label: 'Payment Terms' },
        ],
        hasItems: true,
        deletePermission: 'sales.quotation.delete',
        statusActions: [
            { label: 'Mark Sent', status: 'Sent', confirmMessage: 'Send this quotation to the customer?', icon: CheckCircle, class: 'btn-primary' },
            { label: 'Mark Accepted', status: 'Accepted', confirmMessage: 'Mark this quotation as Accepted?', icon: CheckCircle, class: 'btn-success' },
        ],
        hasPrint: true,
        hasCommunication: true,
    },
    'sale-orders': {
        endpoint: '/sales/sale-orders',
        label: 'Sale Order',
        columns: ['soNo', 'customer.name', 'totalAmount', 'status'],
        viewFields: [
            { key: 'soNo', label: 'SO No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'totalAmount', label: 'Total Amount', render: r => formatLakh(r.totalAmount) },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'customerPoNo', label: 'Customer PO No.' }, { key: 'billingAddress', label: 'Billing Address' },
            { key: 'shippingAddress', label: 'Shipping Address' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'billingAddress', label: 'Billing Address', fullWidth: true },
            { name: 'shippingAddress', label: 'Shipping Address', fullWidth: true },
            { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Dispatched', 'Closed'] },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => formatLakh(r.rate) }, { key: 'status', label: 'Status' }] }],
        formFields: [
            { name: 'quotationId', label: 'Quotation (Accepted)', type: 'dropdown', dropdownKey: 'quotations', dropdownParams: '?status=Accepted', autoFill: 'quotation' },
            { name: 'customerId', label: 'Customer', type: 'dropdown', dropdownKey: 'customers', required: true },
            { name: 'customerPoNo', label: 'Customer PO No.' },
            { name: 'billingAddress', label: 'Billing Address' }, { name: 'shippingAddress', label: 'Shipping Address' },
        ],
        hasItems: true,
        deletePermission: 'sales.saleorder.delete',
        statusActions: [
            { label: 'Dispatch', status: 'Dispatched', confirmMessage: 'Mark this Sale Order as Dispatched?', icon: Truck, class: 'btn-primary' },
            { label: 'Close', status: 'Closed', confirmMessage: 'Close this Sale Order?', icon: CheckCircle, class: 'btn-danger' },
        ],
        hasCommunication: true,
    },
    'dispatch-advices': {
        endpoint: '/sales/dispatch-advices',
        label: 'Dispatch Advice',
        columns: ['dispatchNo', 'saleOrder.customer.name', 'transporter.name', 'vehicleNo', 'status'],
        viewFields: [
            { key: 'dispatchNo', label: 'Dispatch No.' },
            { key: 'saleOrder.soNo', label: 'Sale Order' }, { key: 'saleOrder.customer.name', label: 'Customer' },
            { key: 'transporter.name', label: 'Transporter' },
            { key: 'vehicleNo', label: 'Vehicle No.' }, { key: 'driverName', label: 'Driver' },
            { key: 'dispatchDate', label: 'Dispatch Date' },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
        ],
        editFields: [
            { name: 'vehicleNo', label: 'Vehicle No.' }, { name: 'driverName', label: 'Driver Name' },
            { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Dispatched', 'Delivered'] },
        ],
        formFields: [
            { name: 'saleOrderId', label: 'Sale Order (Pending)', type: 'dropdown', dropdownKey: 'sale-orders', dropdownParams: '?status=Pending', required: true },
            { name: 'transporterId', label: 'Transporter', type: 'dropdown', dropdownKey: 'transporters', required: true },
            { name: 'vehicleNo', label: 'Vehicle No.' }, { name: 'driverName', label: 'Driver Name' },
        ],
        deletePermission: 'sales.dispatch.delete',
    },
    invoices: {
        endpoint: '/sales/invoices',
        label: 'Invoice',
        columns: ['invoiceNo', 'customer.name', 'grandTotal', 'status'],
        viewFields: [
            { key: 'invoiceNo', label: 'Invoice No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'taxableValue', label: 'Taxable Value', render: r => formatLakh(r.taxableValue) },
            { key: 'cgstAmount', label: 'CGST', render: r => formatLakh(r.cgstAmount) },
            { key: 'sgstAmount', label: 'SGST', render: r => formatLakh(r.sgstAmount) },
            { key: 'igstAmount', label: 'IGST', render: r => formatLakh(r.igstAmount) },
            { key: 'grandTotal', label: 'Grand Total', render: r => formatLakh(r.grandTotal) },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'dueDate', label: 'Due Date' }, { key: 'placeOfSupply', label: 'Place of Supply' },
            { key: 'ewayBillNo', label: 'E-Way Bill No.' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'placeOfSupply', label: 'Place of Supply' }, { name: 'ewayBillNo', label: 'E-Way Bill No.' },
            { name: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid', 'Overdue'] },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => formatLakh(r.rate) }, { key: 'total', label: 'Total', render: r => formatLakh(r.total) }] }],
        formFields: [
            { name: 'saleOrderId', label: 'Sale Order (Dispatched)', type: 'dropdown', dropdownKey: 'sale-orders', dropdownParams: '?status=Dispatched', autoFill: 'saleOrder' },
            { name: 'customerId', label: 'Customer', type: 'dropdown', dropdownKey: 'customers', required: true },
            { name: 'placeOfSupply', label: 'Place of Supply' }, { name: 'ewayBillNo', label: 'E-Way Bill No.' },
        ],
        hasItems: true,
        deletePermission: 'sales.invoice.delete',
        hasPrint: true,
        hasCommunication: true,
    },
    collections: {
        endpoint: '/sales/collections',
        label: 'Collection & Reminder',
        columns: ['invoiceNo', 'customer.name', 'grandTotal', 'dueDate', 'reminderStatus'],
        isReadOnly: true,
    },
    receipts: {
        endpoint: '/sales/receipts',
        label: 'Receipt Voucher',
        columns: ['receiptNo', 'customer.name', 'amount', 'paymentMode'],
        viewFields: [
            { key: 'receiptNo', label: 'Receipt No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'amount', label: 'Amount', render: r => formatLakh(r.amount) },
            { key: 'paymentMode', label: 'Payment Mode' }, { key: 'referenceNo', label: 'Reference No.' },
            { key: 'remarks', label: 'Remarks' }, { key: 'receiptDate', label: 'Receipt Date' },
        ],
        editFields: [
            { name: 'referenceNo', label: 'Reference No.' }, { name: 'remarks', label: 'Remarks' },
            { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Cheque', 'NEFT', 'RTGS', 'Cash', 'UPI'] },
        ],
        formFields: [
            { name: 'invoiceId', label: 'Invoice (Outstanding)', type: 'dropdown', dropdownKey: 'invoices', dropdownParams: '?status=outstanding', autoFill: 'invoice' },
            { name: 'customerId', label: 'Customer', type: 'dropdown', dropdownKey: 'customers', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Cheque', 'NEFT', 'RTGS', 'Cash', 'UPI'] },
            { name: 'referenceNo', label: 'Reference No.' },
        ],
        deletePermission: 'sales.receipt.delete',
        hasPrint: true,
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlTab = searchParams.get('tab');
    const [tab, setTab] = useState(urlTab || 'dashboard');
    const { permissions, hasPermission } = useAuthStore();
    const isSalesUser = permissions && !permissions.includes('*') && hasPermission('sales.view') && !hasPermission('purchase.view') && !hasPermission('production.view') && !hasPermission('finance.view');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createForm, setCreateForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);
    const [viewRecord, setViewRecord] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [confirm, setConfirm] = useState({ open: false, loading: false });
    const [dropdowns, setDropdowns] = useState({});
    const [commForm, setCommForm] = useState({ invoiceId: null, channel: 'Email', content: '' });

    const tabs = ['dashboard', 'customers', 'inquiries', 'quotations', 'sale-orders', 'dispatch-advices', 'invoices', 'collections', 'receipts'];
    const TAB_LABELS = { dashboard: 'Dashboard', customers: 'Customers', inquiries: 'Inquiries', quotations: 'Quotations', 'sale-orders': 'Sale Orders', 'dispatch-advices': 'Dispatch', invoices: 'Invoices', collections: 'Collections', receipts: 'Receipts' };
    const cfg = TAB_CONFIG[tab] || {};

    // Load dropdowns for create forms
    const loadDropdowns = useCallback(async () => {
        if (tab === 'dashboard' || tab === 'customers') return;
        const ddMap = { customers: '/sales/dropdown/customers', inquiries: '/sales/dropdown/inquiries', quotations: '/sales/dropdown/quotations', 'sale-orders': '/sales/dropdown/sale-orders', transporters: '/sales/dropdown/transporters', invoices: '/sales/dropdown/invoices', products: '/sales/dropdown/products' };
        const needed = (cfg.formFields || []).filter(f => f.type === 'dropdown').map(f => f.dropdownKey);
        if (cfg.hasItems) needed.push('products');
        const results = {};
        await Promise.all([...new Set(needed)].map(async key => {
            try {
                const field = (cfg.formFields || []).find(f => f.dropdownKey === key);
                const params = field?.dropdownParams || '';
                const res = await api.get((ddMap[key] || `/sales/dropdown/${key}`) + params);
                results[key] = res.data.data || [];
            } catch { results[key] = []; }
        }));
        setDropdowns(results);
    }, [tab]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (tab !== 'dashboard') {
                const res = await api.get(`${cfg.endpoint}?search=${search}`);
                setData(res.data.data || []);
            }
        } catch { toast.error('Failed to load data'); }
        setLoading(false);
    }, [tab, search]);

    useEffect(() => { loadData(); loadDropdowns(); }, [tab]);
    useEffect(() => { setTab(urlTab || 'dashboard'); }, [urlTab]);

    const handleViewOpen = async (item) => {
        setViewLoading(true);
        setViewRecord(item);
        try {
            const res = await api.get(`${cfg.endpoint}/${item.id}`);
            setViewRecord(res.data.data);
        } catch { }
        setViewLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(cfg.endpoint, createForm);
            toast.success(`${cfg.label} created`);
            setShowCreate(false);
            setCreateForm({});
            loadData();
        } catch (e) { toast.error(e.response?.data?.message || 'Error creating record'); }
    };

    const handleDelete = (item) => {
        setConfirm({
            open: true, loading: false,
            title: `Delete ${cfg.label}`,
            message: `Are you sure you want to delete this ${cfg.label?.toLowerCase()}?`,
            confirmLabel: 'Delete', confirmClass: 'btn-danger',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, loading: true }));
                try {
                    await api.delete(`${cfg.endpoint}/${item.id}`);
                    toast.success(`${cfg.label} deleted`);
                    setConfirm({ open: false, loading: false });
                    loadData();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error deleting');
                    setConfirm(c => ({ ...c, loading: false }));
                }
            }
        });
    };

    const handleStatusAction = (item, action) => {
        setConfirm({
            open: true, loading: false,
            title: action.label, message: action.confirmMessage,
            confirmLabel: action.label, confirmClass: action.class || 'btn-primary',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, loading: true }));
                try {
                    await api.put(`${cfg.endpoint}/${item.id}`, { status: action.status });
                    toast.success(`Status updated to ${action.status}`);
                    setConfirm({ open: false, loading: false });
                    setData(prev => prev.map(r => r.id === item.id ? { ...r, status: action.status } : r));
                    if (viewRecord?.id === item.id) setViewRecord(v => ({ ...v, status: action.status }));
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error updating status');
                    setConfirm(c => ({ ...c, loading: false }));
                }
            }
        });
    };

    // Auto-fill: when selecting an inquiry for quotation, fill customer + items
    const handleAutoFill = async (fieldName, value, autoFillType) => {
        if (!value) return;
        try {
            if (autoFillType === 'inquiry') {
                const res = await api.get(`/sales/inquiries/${value}`);
                const inq = res.data.data;
                setCreateForm(prev => ({
                    ...prev,
                    customerId: inq.customerId,
                    items: (inq.items || []).map(it => ({ productId: it.productId, quantity: it.quantity, rate: 0, gstPercent: 18 })),
                }));
            } else if (autoFillType === 'quotation') {
                const res = await api.get(`/sales/quotations/${value}`);
                const qt = res.data.data;
                const cust = (dropdowns.customers || []).find(c => c.id == qt.customerId);
                setCreateForm(prev => ({
                    ...prev,
                    customerId: qt.customerId,
                    billingAddress: cust ? `${cust.address}, ${cust.city}, ${cust.state} - ${cust.pincode}` : '',
                    shippingAddress: cust ? `${cust.address}, ${cust.city}, ${cust.state} - ${cust.pincode}` : '',
                    items: (qt.items || []).map(it => ({ productId: it.productId, quantity: it.quantity, rate: it.rate, gstPercent: it.gstPercent || 18 })),
                }));
            } else if (autoFillType === 'saleOrder') {
                const res = await api.get(`/sales/sale-orders/${value}`);
                const so = res.data.data;
                setCreateForm(prev => ({
                    ...prev,
                    customerId: so.customerId,
                    items: (so.items || []).map(it => ({ productId: it.productId, quantity: it.quantity, rate: it.rate, gstPercent: it.gstPercent || 18 })),
                }));
            } else if (autoFillType === 'invoice') {
                const inv = (dropdowns.invoices || []).find(i => i.id == value);
                if (inv) {
                    setCreateForm(prev => ({ ...prev, customerId: inv.customerId, amount: inv.grandTotal }));
                }
            }
        } catch { }
    };

    const handleSendReminder = async (invoiceId) => {
        if (!commForm.content) { toast.error('Please enter message content'); return; }
        const item = data.find(r => r.id === invoiceId);
        const customerEmail = item?.customer?.email || '';
        
        try {
            await api.post('/sales/communication-logs', { 
                invoiceId, 
                channel: commForm.channel, 
                content: commForm.content 
            });
            
            if (commForm.channel === 'Email') {
                const subject = `Payment Reminder: Invoice #${item?.invoiceNo}`;
                const body = commForm.content;
                window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                toast.success('Reminder logged and opening mail client...');
            } else {
                toast.success('Reminder logged successfully');
            }
            
            setCommForm({ invoiceId: null, channel: 'Email', content: '' });
            loadData();
        } catch { toast.error('Failed to send reminder'); }
    };

    const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

    const renderDropdownField = (f) => {
        const opts = dropdowns[f.dropdownKey] || [];
        const labelFn = (item) => {
            if (f.dropdownKey === 'customers') return `${item.name} (${item.gstin || 'N/A'})`;
            if (f.dropdownKey === 'inquiries') return `${item.inquiryNo} — ${item.customer?.name || ''} [${item.status}]`;
            if (f.dropdownKey === 'quotations') return `${item.quoteNo} — ${item.customer?.name || ''} [${formatLakh(item.totalAmount)}]`;
            if (f.dropdownKey === 'sale-orders') return `${item.soNo} — ${item.customer?.name || ''} [${item.status}]`;
            if (f.dropdownKey === 'invoices') return `${item.invoiceNo} — ${item.customer?.name || ''} [${formatLakh(item.grandTotal)}]`;
            if (f.dropdownKey === 'transporters') return `${item.name} — ${item.mobile || ''}`;
            if (f.dropdownKey === 'products') return `${item.code} — ${item.name}`;
            return item.name || item.id;
        };
        return (
            <select className="form-input" required={f.required} value={createForm[f.name] || ''}
                onChange={e => {
                    const val = e.target.value;
                    setCreateForm(prev => ({ ...prev, [f.name]: val }));
                    if (f.autoFill && val) handleAutoFill(f.name, val, f.autoFill);
                }}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                <option value="">— Select {f.label} —</option>
                {opts.map(item => <option key={item.id} value={item.id}>{labelFn(item)}</option>)}
            </select>
        );
    };

    // ─── Dashboard view ──────────────────────────────────────────────────────
    if (tab === 'dashboard') {
        return (
            <div>
                <div className="page-header"><h1>Sales Management</h1></div>
                {!isSalesUser && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {tabs.map(t => (
                            <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                                style={t === tab ? { background: '#EA580C', borderColor: '#EA580C', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}
                                onClick={() => { setTab(t); setSearchParams({ tab: t }, { replace: false }); }}>
                                {TAB_LABELS[t] || t}
                            </button>
                        ))}
                    </div>
                )}
                <SalesDashboard />
            </div>
        );
    }

    // ─── Collections special view ───────────────────────────────────────────
    if (tab === 'collections') {
        return (
            <div>
                <div className="page-header">
                    <h1>Sales — Collection & Reminder</h1>
                    {!isSalesUser && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                            {tabs.map(t => (
                                <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                                    style={t === tab ? { background: '#EA580C', borderColor: '#EA580C', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}
                                    onClick={() => { setTab(t); setSearchParams({ tab: t }, { replace: false }); }}>
                                    {TAB_LABELS[t] || t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="table-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Invoice #</th><th>Customer</th><th>Grand Total</th><th>Due Date</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {loading ? [1, 2, 3].map(i => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 20 }} /></td></tr>) :
                                    data.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.invoiceNo}</td>
                                            <td><ProfileLink id={item.customerId} name={item.customer?.name} type="customer" /></td>
                                            <td>{formatLakh(item.grandTotal)}</td>
                                            <td>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                                            <td style={{ fontWeight: 600, color: item.outstanding > 0 ? '#DC2626' : '#059669' }}>{formatLakh(item.outstanding)}</td>
                                            <td>
                                                <span className={`badge ${statusClass(item.reminderStatus)}`}
                                                    style={item.reminderStatus === 'Overdue' ? { background: '#FEE2E2', color: '#DC2626', fontWeight: 700 } :
                                                        item.reminderStatus === 'Due Today' ? { background: '#FEF3C7', color: '#D97706', fontWeight: 700 } :
                                                            { background: '#D1FAE5', color: '#059669' }}>
                                                    {item.reminderStatus}{item.daysOverdue > 0 ? ` (${item.daysOverdue}d)` : ''}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                    <button className="btn btn-ghost btn-sm" title="View" onClick={() => handleViewOpen(item)}><Eye size={14} /></button>
                                                    {commForm.invoiceId === item.id ? (
                                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                            <select className="form-input" style={{ padding: '2px 6px', fontSize: 11, width: 70 }} value={commForm.channel} onChange={e => setCommForm(p => ({ ...p, channel: e.target.value }))}>
                                                                <option>Email</option><option>Phone</option><option>WhatsApp</option>
                                                            </select>
                                                            <input className="form-input" style={{ padding: '2px 6px', fontSize: 11, width: 120 }} placeholder="Message..." value={commForm.content} onChange={e => setCommForm(p => ({ ...p, content: e.target.value }))} />
                                                            <button className="btn btn-primary btn-sm" style={{ padding: '2px 6px', background: '#EA580C', borderColor: '#EA580C' }} onClick={() => handleSendReminder(item.id)}><Send size={12} /></button>
                                                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={() => setCommForm({ invoiceId: null, channel: 'Email', content: '' })}>✕</button>
                                                        </div>
                                                    ) : (
                                                        <button className="btn btn-ghost btn-sm" title="Send Reminder" style={{ padding: '4px 8px', color: '#EA580C' }}
                                                            onClick={() => setCommForm({ invoiceId: item.id, channel: 'Email', content: '' })}>
                                                            <Mail size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                {/* Communication history */}
                                                {(item.communications || []).length > 0 && (
                                                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                                                        {item.communications.slice(0, 2).map((c, i) => (
                                                            <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                {c.channel === 'Email' ? <Mail size={10} /> : <Phone size={10} />}
                                                                <span>{new Date(c.sentAt).toLocaleDateString('en-IN')}</span>
                                                                <span className={`badge ${c.status === 'Sent' ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: 9, padding: '1px 4px' }}>{c.status}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                }
                                {!loading && data.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No outstanding invoices</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <RecordViewPanel open={!!viewRecord} onClose={() => setViewRecord(null)} onEdit={() => { }} title="Invoice Details" record={viewRecord}
                    fields={TAB_CONFIG.invoices.viewFields} sections={TAB_CONFIG.invoices.sections || []} canEdit={false} />
            </div>
        );
    }

    // ─── List view ──────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="page-header">
                <h1>Sales — {tab.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}</h1>
                {!isSalesUser && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                        {tabs.map(t => (
                            <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                                style={t === tab ? { background: '#EA580C', borderColor: '#EA580C', whiteSpace: 'nowrap' } : { whiteSpace: 'nowrap' }}
                                onClick={() => { setTab(t); setSearchParams({ tab: t }, { replace: false }); }}>
                                {TAB_LABELS[t] || t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="table-container">
                <div className="table-toolbar">
                    <input className="table-search" placeholder="Search…" value={search}
                        onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} />
                    {!cfg.isReadOnly && (
                        <PermissionGate permission="sales.create">
                            <button className="btn btn-primary btn-sm" style={{ background: '#EA580C', borderColor: '#EA580C' }} onClick={() => { setShowCreate(true); loadDropdowns(); }}><Plus size={16} /> New</button>
                        </PermissionGate>
                    )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                {(cfg.columns || []).map(col => <th key={col}>{col.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}</th>)}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? [1, 2, 3].map(i => <tr key={i}>{(cfg.columns || []).map((c, j) => <td key={j}><div className="skeleton" style={{ height: 20, width: '80%' }} /></td>)}<td /></tr>)
                                : data.map(item => (
                                    <tr key={item.id}>
                                        {(cfg.columns || []).map(col => {
                                            const val = getNestedValue(item, col);
                                            if (col === 'customer.name' || col === 'saleOrder.customer.name') return <td key={col}><ProfileLink id={item.customerId || item.saleOrder?.customerId} name={val} type="customer" /></td>;
                                            if (tab === 'customers' && col === 'name') return <td key={col}><ProfileLink id={item.id} name={val} type="customer" /></td>;
                                            if (col === 'salesPerson') return <td key={col}><ProfileLink id={encodeURIComponent(val)} name={val} type="salesman" /></td>;
                                            if (col === 'status' || col === 'reminderStatus') return <td key={col}><span className={`badge ${statusClass(val)}`}>{val}</span></td>;
                                            if (typeof val === 'number' && (col.includes('Amount') || col.includes('Total') || col.includes('total') || col.includes('amount'))) return <td key={col}>{formatLakh(val)}</td>;
                                            return <td key={col}>{val ?? '—'}</td>;
                                        })}
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                                                <button className="btn btn-ghost btn-sm" title="View" style={{ padding: '4px 8px' }} onClick={() => handleViewOpen(item)}><Eye size={14} /></button>
                                                {!cfg.isReadOnly && (
                                                    <PermissionGate permission="sales.edit">
                                                        <button className="btn btn-ghost btn-sm" title="Edit" style={{ padding: '4px 8px' }} onClick={() => setEditRecord(item)}><Edit size={14} /></button>
                                                    </PermissionGate>
                                                )}
                                                {cfg.hasPrint && (
                                                    <button className="btn btn-ghost btn-sm" title="Print" style={{ padding: '4px 8px' }}
                                                        onClick={() => window.open(`/print/${tab.replace(/s$/, '')}/${item.id}`, '_blank')}><Printer size={14} /></button>
                                                )}
                                                {cfg.hasCommunication && (
                                                    <button className="btn btn-ghost btn-sm" title="Send via WhatsApp/Email" style={{ padding: '4px 8px', color: '#0ea5e9' }}
                                                        onClick={async () => {
                                                            const docType = cfg.label || 'Document';
                                                            const docNo = item.invoiceNo || item.soNo || item.quoteNo || item.id;
                                                            const customerEmail = item.customer?.email || item.saleOrder?.customer?.email || '';
                                                            const subject = `${docType} ${docNo} from ERP System`;
                                                            const body = `Dear Customer,\n\nPlease find attached ${docType} #${docNo}.\n\nTotal Amount: ₹${item.grandTotal || item.totalAmount || 0}\n\nRegards,\nERP Team`;

                                                            const result = openEmailDraftOptions({ to: customerEmail, subject, body });
                                                            if (!result.opened) {
                                                                toast('Email action cancelled');
                                                                return;
                                                            }

                                                            toast.success(`Opening ${result.channel} compose...`);

                                                            try {
                                                                await api.post('/sales/communication-logs', {
                                                                    invoiceId: item.invoiceNo ? item.id : null,
                                                                    channel: 'Email',
                                                                    content: `${docType} ${docNo} draft opened via ${result.channel}${customerEmail ? ` for ${customerEmail}` : ''}`,
                                                                    status: 'Sent'
                                                                });
                                                            } catch (err) {
                                                                console.warn('Communication log failed:', err);
                                                            }
                                                        }}>
                                                        <Send size={14} />
                                                    </button>
                                                )}
                                                {(cfg.statusActions || []).map(action => (
                                                    item.status !== action.status && (
                                                        <PermissionGate key={action.label} permission="sales.edit">
                                                            <button className={`btn btn-sm ${action.class || 'btn-ghost'}`} title={action.label} style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                onClick={() => handleStatusAction(item, action)}><action.icon size={13} /></button>
                                                        </PermissionGate>
                                                    )
                                                ))}
                                                {!cfg.isReadOnly && (
                                                    <PermissionGate permission="sales.delete">
                                                        <button className="btn btn-ghost btn-sm" title="Delete" style={{ padding: '4px 8px', color: 'var(--danger)' }}
                                                            onClick={() => handleDelete(item)}><Trash2 size={14} /></button>
                                                    </PermissionGate>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                            {!loading && data.length === 0 && <tr><td colSpan={(cfg.columns?.length || 0) + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <RecordViewPanel open={!!viewRecord} onClose={() => setViewRecord(null)} onEdit={() => { setEditRecord(viewRecord); setViewRecord(null); }}
                title={`${cfg.label} Details`} record={viewRecord} fields={cfg.viewFields || []} sections={cfg.sections || []} canEdit={!cfg.isReadOnly} />

            <RecordEditModal open={!!editRecord} onClose={() => setEditRecord(null)} onSaved={loadData}
                record={editRecord} endpoint={cfg.endpoint} fields={cfg.editFields || []} title={`Edit ${cfg.label}`} />

            <ConfirmDialog open={confirm.open} onClose={() => setConfirm({ open: false, loading: false })} onConfirm={confirm.onConfirm}
                title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} confirmClass={confirm.confirmClass} loading={confirm.loading} />

            {/* ─── Create modal ─── */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2>New {cfg.label}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {(cfg.formFields || []).map(f => (
                                        <div className="form-group" key={f.name}>
                                            <label className="form-label">{f.label}</label>
                                            {f.type === 'dropdown' ? renderDropdownField(f) :
                                                f.type === 'select' ? (
                                                    <select className="form-input" required={f.required} value={createForm[f.name] || ''} onChange={e => setCreateForm({ ...createForm, [f.name]: e.target.value })}>
                                                        <option value="">— Select —</option>
                                                        {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input className="form-input" type={f.type || 'text'} required={f.required}
                                                        value={createForm[f.name] || ''} onChange={e => setCreateForm({ ...createForm, [f.name]: e.target.value })} />
                                                )
                                            }
                                        </div>
                                    ))}
                                </div>
                                {cfg.hasItems && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4>Line Items</h4>
                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreateForm(prev => ({ ...prev, items: [...(prev.items || []), { productId: '', quantity: 1, rate: 0, gstPercent: 18 }] }))}>
                                                <Plus size={14} /> Add Row
                                            </button>
                                        </div>
                                        <table className="data-table" style={{ fontSize: '12px' }}>
                                            <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>GST %</th><th></th></tr></thead>
                                            <tbody>
                                                {(createForm.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <select className="form-input" style={{ width: '160px', padding: '4px', fontSize: 11 }} required value={item.productId}
                                                                onChange={e => { const ni = [...createForm.items]; ni[idx].productId = e.target.value; const p = (dropdowns.products || []).find(p => p.id == e.target.value); if (p) { ni[idx].rate = p.lastSalePrice; ni[idx].gstPercent = p.gstPercent; } setCreateForm({ ...createForm, items: ni }); }}>
                                                                <option value="">Select</option>
                                                                {(dropdowns.products || []).map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="1" value={item.quantity} onChange={e => { const ni = [...createForm.items]; ni[idx].quantity = e.target.value; setCreateForm({ ...createForm, items: ni }); }} /></td>
                                                        <td><input className="form-input" style={{ width: '80px', padding: '4px' }} type="number" required min="0" step="0.01" value={item.rate} onChange={e => { const ni = [...createForm.items]; ni[idx].rate = e.target.value; setCreateForm({ ...createForm, items: ni }); }} /></td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="0" value={item.gstPercent} onChange={e => { const ni = [...createForm.items]; ni[idx].gstPercent = e.target.value; setCreateForm({ ...createForm, items: ni }); }} /></td>
                                                        <td><button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => { const ni = createForm.items.filter((_, i) => i !== idx); setCreateForm({ ...createForm, items: ni }); }}><Trash2 size={14} /></button></td>
                                                    </tr>
                                                ))}
                                                {(!createForm.items || createForm.items.length === 0) && (
                                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No items added</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <PermissionGate permission="sales.create">
                                    <button type="submit" className="btn btn-primary" style={{ background: '#EA580C', borderColor: '#EA580C' }}>Create</button>
                                </PermissionGate>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ModuleAIAssistant moduleName="Sales" currentTab={tab} data={data} />
        </div>
    );
}
