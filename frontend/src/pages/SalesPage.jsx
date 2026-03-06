import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, ShoppingCart, FileText, DollarSign, AlertTriangle, CheckCircle, XCircle, Truck, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import RecordViewPanel from '../components/RecordViewPanel';
import RecordEditModal from '../components/RecordEditModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProfileLink from '../components/ProfileLink';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

const statusClass = (s) => {
    const map = { New: 'badge-new', Processing: 'badge-processing', Quoted: 'badge-active', Lost: 'badge-overdue', Draft: 'badge-draft', Sent: 'badge-active', Accepted: 'badge-completed', Rejected: 'badge-rejected', Pending: 'badge-pending', Dispatched: 'badge-active', Closed: 'badge-closed', Unpaid: 'badge-pending', Partial: 'badge-partial', Paid: 'badge-paid', Overdue: 'badge-overdue' };
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
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'salesPerson', label: 'Sales Person' }, { name: 'remarks', label: 'Remarks' },
        ],
        deletePermission: 'sales.inquiry.delete',
        statusActions: [{ label: 'Mark Lost', status: 'Lost', confirmMessage: 'Mark this inquiry as Lost?', icon: XCircle, class: 'btn-danger' }],
    },
    quotations: {
        endpoint: '/sales/quotations',
        label: 'Quotation',
        columns: ['quoteNo', 'customer.name', 'totalAmount', 'status'],
        viewFields: [
            { key: 'quoteNo', label: 'Quote No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'totalAmount', label: 'Total Amount', render: r => `₹${Number(r.totalAmount).toLocaleString()}` },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'validUntil', label: 'Valid Until' }, { key: 'paymentTerms', label: 'Payment Terms' },
            { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'paymentTerms', label: 'Payment Terms' },
            { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Accepted', 'Rejected'] },
            { name: 'validUntil', label: 'Valid Until', type: 'date' },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => `₹${Number(r.rate).toLocaleString()}` }, { key: 'total', label: 'Total', render: r => `₹${Number(r.total).toLocaleString()}` }] }],
        formFields: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
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
    },
    'sale-orders': {
        endpoint: '/sales/sale-orders',
        label: 'Sale Order',
        columns: ['soNo', 'customer.name', 'totalAmount', 'status'],
        viewFields: [
            { key: 'soNo', label: 'SO No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'totalAmount', label: 'Total Amount', render: r => `₹${Number(r.totalAmount).toLocaleString()}` },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'customerPoNo', label: 'Customer PO No.' }, { key: 'billingAddress', label: 'Billing Address' },
            { key: 'shippingAddress', label: 'Shipping Address' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'billingAddress', label: 'Billing Address', fullWidth: true },
            { name: 'shippingAddress', label: 'Shipping Address', fullWidth: true },
            { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Dispatched', 'Closed'] },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => `₹${Number(r.rate).toLocaleString()}` }, { key: 'status', label: 'Status' }] }],
        formFields: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'quotationId', label: 'Quotation ID', type: 'number' },
            { name: 'customerPoNo', label: 'Customer PO No.' },
            { name: 'billingAddress', label: 'Billing Address' }, { name: 'shippingAddress', label: 'Shipping Address' },
        ],
        hasItems: true,
        deletePermission: 'sales.saleorder.delete',
        statusActions: [
            { label: 'Dispatch', status: 'Dispatched', confirmMessage: 'Mark this Sale Order as Dispatched? All line items will be updated.', icon: Truck, class: 'btn-primary' },
            { label: 'Close', status: 'Closed', confirmMessage: 'Close this Sale Order? All line items will be marked Closed. This cannot be undone.', icon: CheckCircle, class: 'btn-danger' },
        ],
    },
    invoices: {
        endpoint: '/sales/invoices',
        label: 'Invoice',
        columns: ['invoiceNo', 'customer.name', 'grandTotal', 'status'],
        viewFields: [
            { key: 'invoiceNo', label: 'Invoice No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'taxableValue', label: 'Taxable Value', render: r => `₹${Number(r.taxableValue).toLocaleString()}` },
            { key: 'cgstAmount', label: 'CGST', render: r => `₹${Number(r.cgstAmount).toLocaleString()}` },
            { key: 'sgstAmount', label: 'SGST', render: r => `₹${Number(r.sgstAmount).toLocaleString()}` },
            { key: 'igstAmount', label: 'IGST', render: r => `₹${Number(r.igstAmount).toLocaleString()}` },
            { key: 'grandTotal', label: 'Grand Total', render: r => `₹${Number(r.grandTotal).toLocaleString()}` },
            { key: 'status', label: 'Status', render: r => <span className={`badge ${statusClass(r.status)}`}>{r.status}</span> },
            { key: 'dueDate', label: 'Due Date' }, { key: 'placeOfSupply', label: 'Place of Supply' },
            { key: 'ewayBillNo', label: 'E-Way Bill No.' }, { key: 'createdAt', label: 'Created' },
        ],
        editFields: [
            { name: 'placeOfSupply', label: 'Place of Supply' }, { name: 'ewayBillNo', label: 'E-Way Bill No.' },
            { name: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid', 'Overdue'] },
        ],
        sections: [{ title: 'Line Items', dataKey: 'items', columns: [{ key: 'product.name', label: 'Product', render: r => r.product?.name || r.productId }, { key: 'quantity', label: 'Qty' }, { key: 'rate', label: 'Rate', render: r => `₹${Number(r.rate).toLocaleString()}` }, { key: 'total', label: 'Total', render: r => `₹${Number(r.total).toLocaleString()}` }] }],
        formFields: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'saleOrderId', label: 'Sale Order ID', type: 'number' },
            { name: 'placeOfSupply', label: 'Place of Supply' }, { name: 'ewayBillNo', label: 'E-Way Bill No.' },
        ],
        hasItems: true,
        deletePermission: 'sales.invoice.delete',
        hasPrint: true,
    },
    receipts: {
        endpoint: '/sales/receipts',
        label: 'Receipt Voucher',
        columns: ['receiptNo', 'customer.name', 'amount', 'paymentMode'],
        viewFields: [
            { key: 'receiptNo', label: 'Receipt No.' }, { key: 'customer.name', label: 'Customer' },
            { key: 'amount', label: 'Amount', render: r => `₹${Number(r.amount).toLocaleString()}` },
            { key: 'paymentMode', label: 'Payment Mode' }, { key: 'referenceNo', label: 'Reference No.' },
            { key: 'remarks', label: 'Remarks' }, { key: 'receiptDate', label: 'Receipt Date' },
        ],
        editFields: [
            { name: 'referenceNo', label: 'Reference No.' }, { name: 'remarks', label: 'Remarks' },
            { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Cheque', 'NEFT', 'RTGS', 'Cash'] },
        ],
        formFields: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'paymentMode', label: 'Payment Mode' }, { name: 'referenceNo', label: 'Reference No.' },
        ],
        deletePermission: 'sales.receipt.delete',
        hasPrint: true,
    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesPage() {
    const [tab, setTab] = useState('dashboard');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createForm, setCreateForm] = useState({});
    const [showCreate, setShowCreate] = useState(false);

    // View panel state
    const [viewRecord, setViewRecord] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    // Edit modal state
    const [editRecord, setEditRecord] = useState(null);

    // Confirm dialog state  
    const [confirm, setConfirm] = useState({ open: false, loading: false });

    const tabs = ['dashboard', 'customers', 'inquiries', 'quotations', 'sale-orders', 'invoices', 'receipts'];
    const cfg = TAB_CONFIG[tab] || {};

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (tab === 'dashboard') {
                const res = await api.get('/sales/dashboard');
                setStats(res.data.data);
            } else {
                const res = await api.get(`${cfg.endpoint}?search=${search}`);
                setData(res.data.data || []);
            }
        } catch { toast.error('Failed to load data'); }
        setLoading(false);
    }, [tab, search]);

    useEffect(() => { loadData(); }, [tab]);

    // Fetch full record for view panel
    const handleViewOpen = async (item) => {
        setViewLoading(true);
        setViewRecord(item); // show partial immediately
        try {
            const res = await api.get(`${cfg.endpoint}/${item.id}`);
            setViewRecord(res.data.data);
        } catch { /* keep partial data */ }
        setViewLoading(false);
    };

    // Handle create
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

    // Handle soft delete
    const handleDelete = (item) => {
        setConfirm({
            open: true, loading: false,
            title: `Delete ${cfg.label}`,
            message: `Are you sure you want to delete this ${cfg.label?.toLowerCase()}? This cannot be undone.`,
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

    // Handle status change
    const handleStatusAction = (item, action) => {
        setConfirm({
            open: true, loading: false,
            title: action.label,
            message: action.confirmMessage,
            confirmLabel: action.label, confirmClass: action.class || 'btn-primary',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, loading: true }));
                try {
                    await api.put(`${cfg.endpoint}/${item.id}`, { status: action.status });
                    toast.success(`Status updated to ${action.status}`);
                    setConfirm({ open: false, loading: false });
                    // Update row in-place without full reload
                    setData(prev => prev.map(r => r.id === item.id ? { ...r, status: action.status } : r));
                    if (viewRecord?.id === item.id) setViewRecord(v => ({ ...v, status: action.status }));
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error updating status');
                    setConfirm(c => ({ ...c, loading: false }));
                }
            }
        });
    };

    const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

    // ─── Dashboard view ─────────────────────────────────────────────────────────
    if (tab === 'dashboard') {
        if (loading) return <div className="stats-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;
        const s = stats?.stats;
        const pieData = stats?.inquiriesByStatus?.map(i => ({ name: i.status, value: i._count })) || [];
        return (
            <div>
                <div className="page-header"><h1>Sales Management</h1></div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
                            {t.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon blue"><ShoppingCart size={24} /></div><div><div className="stat-value">{s?.totalCustomers || 0}</div><div className="stat-label">Customers</div></div></div>
                    <div className="stat-card"><div className="stat-icon teal"><FileText size={24} /></div><div><div className="stat-value">{s?.totalInvoices || 0}</div><div className="stat-label">Invoices</div></div></div>
                    <div className="stat-card"><div className="stat-icon amber"><DollarSign size={24} /></div><div><div className="stat-value">₹{((s?.totalRevenue || 0) / 100000).toFixed(1)}L</div><div className="stat-label">Revenue</div></div></div>
                    <div className="stat-card"><div className="stat-icon red"><AlertTriangle size={24} /></div><div><div className="stat-value">{s?.overdueInvoices || 0}</div><div className="stat-label">Overdue</div></div></div>
                </div>
                <div className="charts-grid">
                    <div className="card">
                        <div className="card-header"><span className="card-title">Inquiry Status</span></div>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>{pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie></PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="card">
                        <div className="card-header"><span className="card-title">Recent Invoices</span></div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {(stats?.recentInvoices || []).slice(0, 5).map(inv => (
                                        <tr key={inv.id}><td>{inv.invoiceNo}</td><td><ProfileLink id={inv.customer?.id} name={inv.customer?.name} type="customer" /></td><td>₹{Number(inv.grandTotal)?.toLocaleString()}</td><td><span className={`badge ${statusClass(inv.status)}`}>{inv.status}</span></td></tr>
                                    ))}
                                    {!(stats?.recentInvoices?.length) && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No invoices yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── List view ──────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="page-header">
                <h1>Sales — {tab.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
                            {t.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-container">
                <div className="table-toolbar">
                    <input className="table-search" placeholder="Search…" value={search}
                        onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} />
                    <PermissionGate permission="sales.create">
                        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={16} /> New</button>
                    </PermissionGate>
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
                                            if (col === 'customer.name') return <td key={col}><ProfileLink id={item.customerId} name={val} type="customer" /></td>;
                                            if (tab === 'customers' && col === 'name') return <td key={col}><ProfileLink id={item.id} name={val} type="customer" /></td>;
                                            if (col === 'salesPerson') return <td key={col}><ProfileLink id={encodeURIComponent(val)} name={val} type="salesman" /></td>;
                                            if (col === 'status') return <td key={col}><span className={`badge ${statusClass(val)}`}>{val}</span></td>;
                                            if (typeof val === 'number' && (col.includes('Amount') || col.includes('Total') || col.includes('total') || col.includes('amount'))) return <td key={col}>₹{val?.toLocaleString()}</td>;
                                            return <td key={col}>{val ?? '—'}</td>;
                                        })}
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                                                {/* View */}
                                                <button className="btn btn-ghost btn-sm" title="View" style={{ padding: '4px 8px' }}
                                                    onClick={() => handleViewOpen(item)}>
                                                    <Eye size={14} />
                                                </button>

                                                {/* Edit */}
                                                <PermissionGate permission="sales.edit">
                                                    <button className="btn btn-ghost btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                                                        onClick={() => setEditRecord(item)}>
                                                        <Edit size={14} />
                                                    </button>
                                                </PermissionGate>

                                                {/* Print */}
                                                {cfg.hasPrint && (
                                                    <button className="btn btn-ghost btn-sm" title="Print" style={{ padding: '4px 8px' }}
                                                        onClick={() => window.open(`/print/${tab.replace(/s$/, '')}/${item.id}`, '_blank')}>
                                                        <Printer size={14} />
                                                    </button>
                                                )}

                                                {/* Status actions */}
                                                {(cfg.statusActions || []).map(action => (
                                                    item.status !== action.status && (
                                                        <PermissionGate key={action.label} permission="sales.edit">
                                                            <button
                                                                className={`btn btn-sm ${action.class || 'btn-ghost'}`}
                                                                title={action.label}
                                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                                onClick={() => handleStatusAction(item, action)}
                                                            >
                                                                <action.icon size={13} />
                                                            </button>
                                                        </PermissionGate>
                                                    )
                                                ))}

                                                {/* Delete */}
                                                <PermissionGate permission="sales.delete">
                                                    <button className="btn btn-ghost btn-sm" title="Delete" style={{ padding: '4px 8px', color: 'var(--danger)' }}
                                                        onClick={() => handleDelete(item)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </PermissionGate>
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

            {/* ─── View slide-over panel ─── */}
            <RecordViewPanel
                open={!!viewRecord}
                onClose={() => setViewRecord(null)}
                onEdit={() => { setEditRecord(viewRecord); setViewRecord(null); }}
                title={`${cfg.label} Details`}
                record={viewRecord}
                fields={cfg.viewFields || []}
                sections={cfg.sections || []}
                canEdit={true}
            />

            {/* ─── Edit modal ─── */}
            <RecordEditModal
                open={!!editRecord}
                onClose={() => setEditRecord(null)}
                onSaved={loadData}
                record={editRecord}
                endpoint={cfg.endpoint}
                fields={cfg.editFields || []}
                title={`Edit ${cfg.label}`}
            />

            {/* ─── Confirm dialog (delete / status change) ─── */}
            <ConfirmDialog
                open={confirm.open}
                onClose={() => setConfirm({ open: false, loading: false })}
                onConfirm={confirm.onConfirm}
                title={confirm.title}
                message={confirm.message}
                confirmLabel={confirm.confirmLabel}
                confirmClass={confirm.confirmClass}
                loading={confirm.loading}
            />

            {/* ─── Create modal ─── */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
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
                                            <input className="form-input" type={f.type || 'text'} required={f.required}
                                                value={createForm[f.name] || ''}
                                                onChange={e => setCreateForm({ ...createForm, [f.name]: e.target.value })} />
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
                                            <thead><tr><th>Product ID</th><th>Qty</th><th>Rate</th><th>GST %</th><th></th></tr></thead>
                                            <tbody>
                                                {(createForm.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td><input className="form-input" style={{ width: '80px', padding: '4px' }} type="number" required value={item.productId} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].productId = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="1" value={item.quantity} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].quantity = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '80px', padding: '4px' }} type="number" required min="0" step="0.01" value={item.rate} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].rate = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="0" value={item.gstPercent} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].gstPercent = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => {
                                                            const newItems = createForm.items.filter((_, i) => i !== idx);
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }}><Trash2 size={14} /></button></td>
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
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </PermissionGate>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
