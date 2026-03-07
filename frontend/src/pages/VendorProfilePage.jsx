import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText, IndianRupee, PieChart, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import DataTable from '../components/DataTable';

export default function VendorProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/purchase/vendors/${id}/profile`);
                setProfile(res.data.data);
            } catch (e) {
                toast.error('Failed to load vendor profile');
                navigate('/purchase');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 200, marginBottom: 20 }} /><div className="skeleton" style={{ height: 400 }} /></div>;
    if (!profile) return null;

    const { vendor, metrics, purchaseOrders, bills, payments } = profile;

    const poCols = [
        { key: 'poNo', label: 'PO No' },
        { key: 'totalAmount', label: 'Amount', render: r => `₹${Number(r.totalAmount || 0).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() }
    ];

    const billCols = [
        { key: 'billNo', label: 'Bill No' },
        { key: 'totalAmount', label: 'Amount', render: r => `₹${Number(r.totalAmount || 0).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'dueDate', label: 'Due Date', render: r => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—' }
    ];

    const paymentCols = [
        { key: 'voucherNo', label: 'Voucher No' },
        { key: 'amount', label: 'Amount', render: r => `₹${Number(r.amount || 0).toLocaleString()}` },
        { key: 'paymentMode', label: 'Mode' },
        { key: 'paymentDate', label: 'Date', render: r => new Date(r.paymentDate).toLocaleDateString() }
    ];

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Vendor Profile</h1>
                <div style={{ marginLeft: 'auto' }}>
                    <PermissionGate permission="purchase.vendor.edit">
                        <button className="btn btn-primary btn-sm"><Edit size={16} /> Edit Profile</button>
                    </PermissionGate>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'linear-gradient(135deg, var(--teal-light), var(--blue-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                            {vendor.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{vendor.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><FileText size={14} /> GSTIN: {vendor.gstin || '—'}</p>
                            <span className={`badge badge-${vendor.isActive ? 'active' : 'closed'}`}>{vendor.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Person</div><div style={{ fontSize: 14 }}>{vendor.contactPerson || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Name</div><div style={{ fontSize: 14 }}>{vendor.bankName || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> Phone</div><div style={{ fontSize: 14 }}>{vendor.phone || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account No</div><div style={{ fontSize: 14 }}>{vendor.bankAccount || '—'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> Location</div><div style={{ fontSize: 14 }}>{vendor.city}, {vendor.state}</div></div>
                    </div>
                </div>

                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-icon teal"><PieChart size={24} /></div>
                            <div><div className="stat-value">₹{Number(metrics.totalPurchases / 100000).toFixed(2)}L</div><div className="stat-label">Total Purchases</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><IndianRupee size={24} /></div>
                            <div><div className="stat-value" style={{ color: metrics.outstanding > 0 ? 'var(--red)' : 'inherit' }}>₹{Number(metrics.outstanding).toLocaleString()}</div><div className="stat-label">Outstanding Payable</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><ShoppingCart size={24} /></div>
                            <div><div className="stat-value">{metrics.totalOrders}</div><div className="stat-label">Total Purchase Orders</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div>
                    <h3 style={{ marginBottom: 16 }}>Purchase Orders</h3>
                    <DataTable data={purchaseOrders} columns={poCols} perPage={5} />
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Recent Bills</h3>
                    <DataTable data={bills} columns={billCols} perPage={5} />
                </div>
            </div>

            <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 16 }}>Payment History</h3>
                <DataTable data={payments} columns={paymentCols} perPage={5} />
            </div>
        </div>
    );
}
