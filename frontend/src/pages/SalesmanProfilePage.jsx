import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText, IndianRupee, PieChart, ShoppingCart, Target } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import DataTable from '../components/DataTable';

export default function SalesmanProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/sales/salesmen/${id}/profile`);
                setProfile(res.data.data);
            } catch (e) {
                toast.error('Failed to load salesman profile');
                navigate('/sales');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 200, marginBottom: 20 }} /><div className="skeleton" style={{ height: 400 }} /></div>;
    if (!profile) return null;

    const { employee, metrics, inquiries, saleOrders } = profile;

    const inqCols = [
        { key: 'inquiryNo', label: 'Inquiry No' },
        { key: 'customer.name', label: 'Customer' },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() }
    ];

    const orderCols = [
        { key: 'soNo', label: 'SO No' },
        { key: 'grandTotal', label: 'Amount', render: r => `₹${Number(r.grandTotal || 0).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase().replace(' ', '-')}`}>{r.status}</span> },
        { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString() }
    ];

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Salesman Performance Details</h1>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'linear-gradient(135deg, var(--amber-light), var(--red-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                            {employee.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{employee.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><FileText size={14} /> Emp Code: {employee.empCode}</p>
                            <span className={`badge badge-${employee.isActive ? 'active' : 'closed'}`}>{employee.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> Phone</div><div style={{ fontSize: 14 }}>{employee.mobile || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div><div style={{ fontSize: 14 }}>{employee.department || '—'}</div></div>
                    </div>
                </div>

                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Target size={24} /></div>
                            <div><div className="stat-value">{metrics.conversionRate}%</div><div className="stat-label">Inquiry Conversion Rate</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon teal"><ShoppingCart size={24} /></div>
                            <div><div className="stat-value">₹{Number(metrics.totalSales / 100000).toFixed(2)}L</div><div className="stat-label">Total Converted Sales</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon amber"><IndianRupee size={24} /></div>
                            <div><div className="stat-value">₹{Number(metrics.commission).toLocaleString()}</div><div className="stat-label">Est. Commission (2%)</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div>
                    <h3 style={{ marginBottom: 16 }}>Inquiries Handled</h3>
                    <DataTable data={inquiries} columns={inqCols} perPage={5} />
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Converted Sale Orders</h3>
                    <DataTable data={saleOrders} columns={orderCols} perPage={5} />
                </div>
            </div>
        </div>
    );
}
