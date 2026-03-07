import { useState, useEffect, useRef } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ShoppingCart, FileText, DollarSign, AlertTriangle, TrendingUp, Users, Package, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const ORANGE_ACCENT = '#F97316';
const CHART_COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74', '#374151'];

const formatLakh = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
};

// Keeping AnimatedCounter for backward compatibility if any other file uses it
function AnimatedCounter({ end, duration = 1500, prefix = '', suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const target = Number(end) || 0;
        if (target === 0) { setCount(0); return; }
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) ref.current = requestAnimationFrame(tick);
        };
        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [end, duration]);
    return <span>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

const useCountUp = (end, duration = 1000) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (end === 0) { setCount(0); return; }

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            countRef.current = Math.floor(eased * end);
            setCount(countRef.current);
            if (progress < 1) requestAnimationFrame(animate);
        };

        startTimeRef.current = null;
        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
};

const KPICard = ({ icon: Icon, label, value, isCurrency = false, isDanger = false, customSuffix = '' }) => {
    const animatedValue = useCountUp(value, 800);

    return (
        <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
            <div className="stat-icon" style={{
                background: isDanger ? '#FEE2E2' : 'var(--glass-bg)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={20} color={isDanger ? '#DC2626' : '#6B7280'} strokeWidth={1.5} />
            </div>
            <div style={{ flexShrink: 0 }}>
                <div style={{ color: isDanger ? '#DC2626' : '#000000', fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {isCurrency ? formatLakh(animatedValue) : `${animatedValue}${customSuffix}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>{label}</div>
            </div>
        </div>
    );
};

// Custom tooltip with orange accent
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.98)',
                border: '1px solid #F97316',
                borderRadius: '6px',
                padding: '10px 12px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.15)'
            }}>
                <p style={{ fontWeight: 600, marginBottom: '6px', color: '#374151', fontSize: '12px' }}>{label}</p>
                {payload.map((entry, idx) => (
                    <p key={idx} style={{ color: entry.color || entry.fill, margin: '3px 0', fontSize: '11px' }}>
                        {entry.name}: {entry.value > 999 ? formatLakh(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function SalesDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/sales/dashboard');
            setStats(res.data.data);
        } catch (err) { }
        setLoading(false);
    };

    useEffect(() => { fetchDashboard(); }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <RefreshCw size={32} className="spin" style={{ color: ORANGE_ACCENT }} />
            </div>
        );
    }

    if (!stats) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Failed to load dashboard data</div>;

    const s = stats.stats || {};
    const pieData = (stats.inquiriesByStatus || []).map(i => ({ name: i.status, value: i._count }));
    const soData = (stats.soByStatus || []).map(i => ({ name: i.status, value: i._count }));
    const revenueVsCollected = [
        { name: 'Invoice Value', value: s.totalInvoiceValue || 0 },
        { name: 'Collected', value: s.totalCollected || 0 },
        { name: 'Outstanding', value: s.totalOutstanding || 0 },
    ];
    const monthlyData = stats.monthlyRevenue || [];
    const topCustomers = stats.topCustomers || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI Cards Row */}
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'nowrap',
                width: '100%',
                overflowX: 'auto',
                paddingBottom: '4px' // prevent scrollbar hiding shadow
            }}>
                <KPICard icon={Users} label="Customers" value={s.totalCustomers} />
                <KPICard icon={FileText} label="Inquiries" value={(stats.inquiriesByStatus || []).reduce((a, b) => a + b._count, 0)} />
                <KPICard icon={Package} label="Quotations" value={s.totalQuotations} />
                <KPICard icon={ShoppingCart} label="Invoices" value={s.totalInvoices} />
                <KPICard icon={TrendingUp} label="Conv. Rate" value={s.conversionRate || 0} customSuffix="%" />
                <KPICard icon={DollarSign} label="Revenue" value={s.totalRevenue} isCurrency />
                <KPICard icon={AlertTriangle} label="Overdue" value={s.overdueAmount} isCurrency isDanger />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* Monthly Revenue Trend */}
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Monthly Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Inquiry Funnel */}
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Inquiry Status</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                                label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                    if (percent < 0.05) return null;
                                    const RADIAN = Math.PI / 180;
                                    const radius = outerRadius + 20;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                                            {`${name} (${(percent * 100).toFixed(0)}%)`}
                                        </text>
                                    );
                                }}
                                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                            >
                                {pieData.map((entry, idx) => (
                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* Sale Orders by Status */}
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>SO by Status</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={soData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Orders" fill="#6B7280" radius={[3, 3, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue vs Collected vs Outstanding */}
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Inv vs Collected vs Due</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={revenueVsCollected} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Amount" radius={[3, 3, 0, 0]} barSize={30}>
                                {revenueVsCollected.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Customers horizontal bar chart */}
                <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Top 5 Customers</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                            <XAxis type="number" tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} />
                            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="totalBilled" name="Billed Amount" fill="#F97316" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Invoices Table (matching Finance Recent Transactions style) */}
            <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Recent Invoices</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Invoice No</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Customer</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Date</th>
                                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Amount</th>
                                <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.recentInvoices || []).slice(0, 6).map((inv, idx) => (
                                <tr key={`inv-${inv.id}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{inv.invoiceNo}</td>
                                    <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {inv.customer?.name || '—'}
                                    </td>
                                    <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280' }}>
                                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: '#F97316' }}>
                                        {formatLakh(inv.grandTotal)}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            background: inv.status === 'Paid' ? '#D1FAE5' :
                                                inv.status === 'Overdue' ? '#FEE2E2' : '#FEF3C7',
                                            color: inv.status === 'Paid' ? '#065F46' :
                                                inv.status === 'Overdue' ? '#991B1B' : '#92400E'
                                        }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!(stats.recentInvoices?.length) &&
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        No invoices yet
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export { formatLakh, AnimatedCounter };
