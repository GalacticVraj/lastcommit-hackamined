import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText, IndianRupee, PieChart, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import DataTable from '../components/DataTable';

export default function CustomerProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/sales/customers/${id}/profile`);
                setProfile(res.data.data);
            } catch (e) {
                toast.error('Failed to load customer profile');
                navigate('/sales');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 200, marginBottom: 20 }} /><div className="skeleton" style={{ height: 400 }} /></div>;
    if (!profile) return null;

    const { customer, metrics, saleOrders, invoices } = profile;

    const orderCols = [
        { key: 'soNo', label: 'SO No' },
        { key: 'poRef', label: 'PO Ref' },
        { key: 'grandTotal', label: 'Amount', render: r => `₹${Number(r.grandTotal).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() }
    ];

    const invoiceCols = [
        { key: 'invoiceNo', label: 'Invoice No' },
        { key: 'grandTotal', label: 'Amount', render: r => `₹${Number(r.grandTotal).toLocaleString()}` },
        { key: 'paymentStatus', label: 'Payment', render: r => <span className={`badge badge-${r.paymentStatus.toLowerCase()}`}>{r.paymentStatus}</span> },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'dueDate', label: 'Due Date', render: r => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' }
    ];

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Customer Profile</h1>
                <div style={{ marginLeft: 'auto' }}>
                    <PermissionGate permission="sales.customer.edit">
                        <button className="btn btn-primary btn-sm"><Edit size={16} /> Edit Profile</button>
                    </PermissionGate>
                </div>
            </div>

            {/* Top Cards */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'linear-gradient(135deg, var(--blue-light), var(--teal-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{customer.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><FileText size={14} /> GSTIN: {customer.gstin || '—'}</p>
                            <span className={`badge badge-${customer.isActive ? 'active' : 'closed'}`}>{customer.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Person</div><div style={{ fontSize: 14 }}>{customer.contactPerson || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Communication</div><div style={{ fontSize: 14 }}>{customer.reminderMode || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> Phone</div><div style={{ fontSize: 14 }}>{customer.mobile || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> Email</div><div style={{ fontSize: 14 }}>{customer.email || '—'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> Location</div><div style={{ fontSize: 14 }}>{customer.city}, {customer.state}</div></div>
                    </div>
                </div>

                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-icon blue"><PieChart size={24} /></div>
                            <div><div className="stat-value">₹{Number(metrics.totalBusiness / 100000).toFixed(2)}L</div><div className="stat-label">Total Business</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><IndianRupee size={24} /></div>
                            <div><div className="stat-value" style={{ color: metrics.outstanding > 0 ? 'var(--red)' : 'inherit' }}>₹{Number(metrics.outstanding).toLocaleString()}</div><div className="stat-label">Outstanding Due</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon teal"><ShoppingCart size={24} /></div>
                            <div><div className="stat-value">{metrics.totalOrders}</div><div className="stat-label">Total Sale Orders</div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tables */}
            <div className="grid-2">
                <div>
                    <h3 style={{ marginBottom: 16 }}>Recent Sale Orders</h3>
                    <DataTable data={saleOrders} columns={orderCols} perPage={5} />
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Recent Invoices</h3>
                    <DataTable data={invoices} columns={invoiceCols} perPage={5} />
                </div>
            </div>

            <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Communication Log</h3>
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No communication history available.
                </div>
            </div>
        </div>
    );
}
