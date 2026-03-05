import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShoppingCart, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { PermissionGate } from '../hooks/usePermission';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

const statusClass = (s) => {
    const map = { New: 'badge-new', Processing: 'badge-processing', Quoted: 'badge-active', Lost: 'badge-overdue', Draft: 'badge-draft', Sent: 'badge-active', Accepted: 'badge-completed', Rejected: 'badge-rejected', Pending: 'badge-pending', Dispatched: 'badge-active', Closed: 'badge-closed', Unpaid: 'badge-pending', Partial: 'badge-partial', Paid: 'badge-paid', Overdue: 'badge-overdue' };
    return map[s] || 'badge-draft';
};

export default function SalesPage() {
    const [tab, setTab] = useState('dashboard');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({});

    const tabs = ['dashboard', 'customers', 'inquiries', 'quotations', 'sale-orders', 'invoices', 'receipts'];

    useEffect(() => {
        loadData();
    }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'dashboard') {
                const res = await api.get('/sales/dashboard');
                setStats(res.data.data);
            } else {
                const endpoint = tab === 'sale-orders' ? '/sales/sale-orders' : `/sales/${tab}`;
                const res = await api.get(`${endpoint}?search=${search}`);
                setData(res.data.data);
            }
        } catch (e) {
            toast.error('Failed to load data');
        }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const endpoint = tab === 'sale-orders' ? '/sales/sale-orders' : `/sales/${tab}`;
            await api.post(endpoint, form);
            toast.success('Created successfully');
            setShowModal(false);
            setForm({});
            loadData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Error creating record');
        }
    };

    // Dashboard Tab
    if (tab === 'dashboard') {
        if (loading) return <div className="stats-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;
        const s = stats?.stats;
        const pieData = stats?.inquiriesByStatus?.map(i => ({ name: i.status, value: i._count })) || [];
        return (
            <div>
                <div className="page-header">
                    <h1>Sales Management</h1>
                </div>
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
                                        <tr key={inv.id}><td>{inv.invoiceNo}</td><td>{inv.customer?.name}</td><td>₹{inv.grandTotal?.toLocaleString()}</td><td><span className={`badge ${statusClass(inv.status)}`}>{inv.status}</span></td></tr>
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

    // List Tab
    const columns = {
        customers: ['name', 'gstin', 'city', 'state', 'contactPerson', 'phone'],
        inquiries: ['inquiryNo', 'customer.name', 'salesPerson', 'status'],
        quotations: ['quoteNo', 'customer.name', 'totalAmount', 'status'],
        'sale-orders': ['soNo', 'customer.name', 'totalAmount', 'status'],
        invoices: ['invoiceNo', 'customer.name', 'grandTotal', 'status'],
        receipts: ['receiptNo', 'customer.name', 'amount', 'paymentMode'],
    };

    const formFields = {
        customers: [
            { name: 'name', label: 'Name', required: true },
            { name: 'gstin', label: 'GSTIN' },
            { name: 'stateCode', label: 'State Code' },
            { name: 'address', label: 'Address' },
            { name: 'city', label: 'City' },
            { name: 'state', label: 'State' },
            { name: 'contactPerson', label: 'Contact Person' },
            { name: 'phone', label: 'Phone' },
            { name: 'email', label: 'Email' },
            { name: 'creditPeriod', label: 'Credit Period (days)', type: 'number' },
        ],
        inquiries: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'salesPerson', label: 'Sales Person' },
            { name: 'remarks', label: 'Remarks' },
        ],
        quotations: [
            { name: 'customerId', label: 'Customer ID', type: 'number', required: true },
            { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
            { name: 'paymentTerms', label: 'Payment Terms' },
        ],
    };

    const getNestedValue = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

    return (
        <div>
            <div className="page-header">
                <h1>Sales — {tab.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</h1>
                <div className="page-header-actions">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {tabs.map(t => (
                            <button key={t} className={`btn ${t === tab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
                                {t.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="table-container">
                <div className="table-toolbar">
                    <input className="table-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} />
                    <PermissionGate module="sales" action={`${tab.replace('s', '')}.create`}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={16} /> New</button>
                    </PermissionGate>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>{(columns[tab] || []).map(col => <th key={col}>{col.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}</th>)}<th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i}>{(columns[tab] || []).map((c, j) => <td key={j}><div className="skeleton" style={{ height: 20, width: '80%' }} /></td>)}<td></td></tr>)
                            ) : (
                                data.map(item => (
                                    <tr key={item.id}>
                                        {(columns[tab] || []).map(col => {
                                            const val = getNestedValue(item, col);
                                            if (col === 'status') return <td key={col}><span className={`badge ${statusClass(val)}`}>{val}</span></td>;
                                            if (typeof val === 'number' && (col.includes('Amount') || col.includes('Total') || col.includes('total') || col.includes('amount'))) return <td key={col}>₹{val?.toLocaleString()}</td>;
                                            return <td key={col}>{val ?? '—'}</td>;
                                        })}
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}><Eye size={14} /></button>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}><Edit size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && data.length === 0 && <tr><td colSpan={(columns[tab]?.length || 0) + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New {tab.replace('-', ' ').replace(/^\w/, c => c.toUpperCase()).replace(/s$/, '')}</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {(formFields[tab] || [{ name: 'name', label: 'Name', required: true }]).map(field => (
                                    <div className="form-group" key={field.name}>
                                        <label className="form-label">{field.label}</label>
                                        <input className="form-input" type={field.type || 'text'} required={field.required}
                                            value={form[field.name] || ''} onChange={e => setForm({ ...form, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })} />
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
