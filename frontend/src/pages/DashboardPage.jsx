import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, AlertTriangle, Package, Factory, Warehouse as WarehouseIcon, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/api';

const COLORS = ['#2563EB', '#0D9488', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get('/dashboard');
            setDashboard(res.data.data);
        } catch (e) {
            console.error('dashboard load failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 60000);
        return () => clearInterval(id);
    }, []);

    const statCards = dashboard ? [
        { label: 'Sales This Month', value: `₹${(dashboard.salesThisMonth.value / 100000).toFixed(1)}L`, icon: DollarSign, color: 'blue', trend: dashboard.salesThisMonth.changePct != null ? `${dashboard.salesThisMonth.changePct.toFixed(1)}%` : null, up: dashboard.salesThisMonth.changePct >= 0 },
        { label: 'Outstanding Receivables', value: `₹${(dashboard.outstandingReceivables.value || 0).toLocaleString()}`, icon: AlertTriangle, color: 'red' },
        { label: 'Open Purchase Orders', value: dashboard.openPurchaseOrders.value, icon: Package, color: 'teal' },
        { label: 'Active Production Orders', value: dashboard.productionOrdersActive.value, icon: Factory, color: 'amber' },
    ] : [];

    const barData = [
        { month: 'Oct', sales: 420000, purchase: 280000 },
        { month: 'Nov', sales: 580000, purchase: 350000 },
        { month: 'Dec', sales: 490000, purchase: 310000 },
        { month: 'Jan', sales: 630000, purchase: 420000 },
        { month: 'Feb', sales: 550000, purchase: 380000 },
        { month: 'Mar', sales: 720000, purchase: 450000 },
    ];

    const pieData = [
        { name: 'Paid', value: 45 },
        { name: 'Partial', value: 18 },
        { name: 'Unpaid', value: 25 },
        { name: 'Overdue', value: 12 },
    ];

    if (loading) return <div className="stats-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>;

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <div className="page-header-actions">
                    <button className="btn btn-ghost btn-sm">Export Report</button>
                </div>
            </div>

            <div className="stats-grid">
                {statCards.map(card => (
                    <div className="stat-card" key={card.label}>
                        <div className={`stat-icon ${card.color}`}><card.icon size={24} /></div>
                        <div>
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-label">{card.label}</div>
                            {card.trend && <div className={`stat-trend ${card.up ? 'up' : 'down'}`}>{card.trend}</div>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="card">
                    <div className="card-header"><span className="card-title">Sales Last 6 Months</span></div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboard?.monthlySales || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" />
                            <YAxis stroke="var(--text-muted)" tickFormatter={v => `₹${v / 1000}K`} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} name="Sales" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="card-header"><span className="card-title">Sale Order Status</span></div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={dashboard?.saleOrderStatus || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {(dashboard?.saleOrderStatus || []).map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top customers & recent activities */}
            <div className="grid-2" style={{ marginTop: 24 }}>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Top Customers This Month</h3>
                    <table className="data-table">
                        <thead><tr><th>Customer</th><th>Amount</th></tr></thead>
                        <tbody>
                            {(dashboard?.topCustomers || []).map(c => (
                                <tr key={c.id}><td>{c.name}</td><td>₹{Number(c.amount).toLocaleString()}</td></tr>
                            ))}
                            {!(dashboard?.topCustomers?.length) && <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>None</td></tr>}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Recent Activities</h3>
                    <table className="data-table">
                        <thead><tr><th>User</th><th>Action</th><th>When</th></tr></thead>
                        <tbody>
                            {(dashboard?.recentActivities || []).map(a => (
                                <tr key={a.id}><td>{a.userName}</td><td>{a.action} {a.entity}{a.entityId ? `#${a.entityId}` : ''}</td><td>{new Date(a.createdAt).toLocaleString()}</td></tr>
                            ))}
                            {!(dashboard?.recentActivities?.length) && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>None</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
