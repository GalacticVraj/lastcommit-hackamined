import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, AlertTriangle, Package, Factory, Warehouse as WarehouseIcon, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import api from '../lib/api';

const COLORS = ['#F97316', '#374151', '#FB923C', '#6B7280'];

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
                        <BarChart data={barData} barGap={8} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="month" stroke="#374151" fontSize={11} fontWeight={500} tickLine={false} axisLine={{ stroke: '#D1D5DB' }} />
                            <YAxis stroke="#374151" fontSize={11} fontWeight={500} tickFormatter={v => `₹${v / 1000}K`} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D1D5DB', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', fontSize: '12px' }} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                            <Bar dataKey="sales" fill="#F97316" name="Sales" />
                            <Bar dataKey="purchase" fill="#374151" name="Purchase" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card">
                    <div className="card-header"><span className="card-title">Invoice Status</span></div>
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart margin={{ top: 40, right: 100, left: 100, bottom: 40 }}>
                            <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={110} 
                                paddingAngle={1} 
                                dataKey="value" 
                                stroke="#1F2937" 
                                strokeWidth={1} 
                                label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = outerRadius + 45;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} fill="#1F2937" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={500}>
                                            {`${name} ${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                                labelLine={({ cx, cy, midAngle, outerRadius }) => {
                                    const RADIAN = Math.PI / 180;
                                    const startRadius = outerRadius + 5;
                                    const endRadius = outerRadius + 35;
                                    const x1 = cx + startRadius * Math.cos(-midAngle * RADIAN);
                                    const y1 = cy + startRadius * Math.sin(-midAngle * RADIAN);
                                    const x2 = cx + endRadius * Math.cos(-midAngle * RADIAN);
                                    const y2 = cy + endRadius * Math.sin(-midAngle * RADIAN);
                                    const arrowSize = 6;
                                    const angle = Math.atan2(y2 - y1, x2 - x1);
                                    const arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6);
                                    const arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6);
                                    const arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6);
                                    const arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6);
                                    return (
                                        <g>
                                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#374151" strokeWidth={1} />
                                            <polygon points={`${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`} fill="#374151" />
                                        </g>
                                    );
                                }}
                            >
                                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #374151', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
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
