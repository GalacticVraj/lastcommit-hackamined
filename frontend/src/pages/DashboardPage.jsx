import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, AlertTriangle, Package, Factory, Warehouse as WarehouseIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import api from '../lib/api';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EC4899'];

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard').then(res => {
            setStats(res.data.data.stats);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        { label: 'Total Revenue', value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`, icon: DollarSign, color: 'blue', trend: '+12.5%', up: true },
        { label: 'Total Invoices', value: stats.totalInvoices, icon: FileText, color: 'teal', trend: '+8.2%', up: true },
        { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'amber' },
        { label: 'Overdue Invoices', value: stats.overdueInvoices, icon: AlertTriangle, color: 'red' },
        { label: 'Vendors', value: stats.totalVendors, icon: Package, color: 'blue' },
        { label: 'Products', value: stats.totalProducts, icon: Factory, color: 'teal' },
        { label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'amber' },
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
                    <div className="card-header"><span className="card-title">Monthly Sales vs Purchase</span></div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                            <YAxis stroke="#6B7280" fontSize={12} tickFormatter={v => `₹${v / 1000}K`} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} name="Sales" />
                            <Bar dataKey="purchase" fill="#059669" radius={[4, 4, 0, 0]} name="Purchase" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="card-header"><span className="card-title">Invoice Status</span></div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <span className="card-title">Quick Actions</span>
                </div>
                <div className="quick-actions-grid">
                    {[
                        { label: 'New Inquiry', to: '/sales' },
                        { label: 'New Purchase Order', to: '/purchase' },
                        { label: 'Production Report', to: '/production' },
                        { label: 'Run Simulation', to: '/simulation' },
                        { label: 'Generate Payroll', to: '/hr' },
                        { label: 'View Reports', to: '/reports' },
                    ].map(action => (
                        <a href={action.to} key={action.label} className="btn btn-ghost quick-action-btn">
                            {action.label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
