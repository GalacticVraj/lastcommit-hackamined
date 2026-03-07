import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, FileText, DollarSign, AlertTriangle, Package, Factory,
    Warehouse as WarehouseIcon, TrendingUp, ShoppingCart, Truck, Wrench,
    Shield, ClipboardCheck, HardHat, BarChart3, Receipt, CreditCard, Scale,
    BookOpen, RefreshCw
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import api from '../lib/api';

/* ── Theme constants (matching SalesDashboard) ── */
const ORANGE = '#F97316';
const CHART_COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74', '#374151'];
const formatLakh = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const n = Number(val);
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
};

/* ── Animated counter hook (same as SalesDashboard) ── */
const useCountUp = (end, duration = 800) => {
    const [count, setCount] = useState(0);
    const startRef = useRef(null);
    useEffect(() => {
        if (!end) { setCount(0); return; }
        const animate = (ts) => {
            if (!startRef.current) startRef.current = ts;
            const p = Math.min((ts - startRef.current) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
            if (p < 1) requestAnimationFrame(animate);
        };
        startRef.current = null;
        requestAnimationFrame(animate);
    }, [end]);
    return count;
};

/* ── Custom tooltip (matching SalesDashboard) ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.98)', border: `1px solid ${ORANGE}`,
                borderRadius: '6px', padding: '10px 12px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.15)'
            }}>
                <p style={{ fontWeight: 600, marginBottom: 6, color: '#374151', fontSize: 12 }}>{label}</p>
                {payload.map((e, i) => (
                    <p key={i} style={{ color: e.color || e.fill, margin: '3px 0', fontSize: 11 }}>
                        {e.name}: {e.value > 999 ? formatLakh(e.value) : e.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

/* ── KPI Card (reuses stat-card class from index.css) ── */
const KPI = ({ icon: Icon, label, value, isCurrency, isDanger }) => {
    const v = useCountUp(isCurrency ? value : value, 800);
    return (
        <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
            <div className="stat-icon" style={{
                background: isDanger ? '#FEE2E2' : 'var(--glass-bg)',
                border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px',
                width: 40, height: 40, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={20} color={isDanger ? '#DC2626' : '#6B7280'} strokeWidth={1.5} />
            </div>
            <div style={{ flexShrink: 0 }}>
                <div style={{ color: isDanger ? '#DC2626' : '#000', fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {isCurrency ? formatLakh(v) : v}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>{label}</div>
            </div>
        </div>
    );
};

/* ── Module Card ── */
const MODULE_ICONS = {
    Sales: TrendingUp, Purchase: ShoppingCart, Production: Factory,
    HR: Users, Finance: DollarSign, Quality: ClipboardCheck,
    Warehouse: WarehouseIcon, Logistics: Truck, Maintenance: Wrench,
    Contractors: HardHat, Assets: BookOpen, Statutory: Scale,
};
const MODULE_COLORS = {
    Sales: '#F97316', Purchase: '#3B82F6', Production: '#8B5CF6',
    HR: '#10B981', Finance: '#EAB308', Quality: '#06B6D4',
    Warehouse: '#78716C', Logistics: '#0EA5E9', Maintenance: '#D946EF',
    Contractors: '#F43F5E', Assets: '#14B8A6', Statutory: '#A855F7',
};

const ModuleCard = ({ title, route, items }) => {
    const Icon = MODULE_ICONS[title] || Package;
    const shown = items.slice(0, 3);
    return (
        <Link to={route} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ cursor: 'pointer', padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="stat-icon" style={{
                        width: 32, height: 32, borderRadius: 8,
                    }}>
                        <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{title}</span>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    flex: 1,
                    alignContent: 'center',
                }}>
                    {shown.map(it => (
                        <div key={it.label} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: 18, fontWeight: 700,
                                color: it.warn ? 'var(--danger)' : 'var(--text-primary)',
                            }}>{it.value ?? 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{it.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Link>
    );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard').then(r => { setData(r.data.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <RefreshCw size={32} className="spin" style={{ color: ORANGE }} />
        </div>
    );

    if (!data?.stats) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Failed to load dashboard</div>;

    const s = data.stats;
    const invoicePie = (data.invoicesByStatus || []).map(i => ({ name: i.status, value: i._count }));
    const moduleSummary = data.moduleSummary || [];

    const moduleGroups = [
        {
            title: 'Sales', route: '/sales', items: [
                { label: 'Revenue', value: formatLakh(s.totalRevenue) },
                { label: 'Invoices', value: s.totalInvoices },
                { label: 'Customers', value: s.totalCustomers },
                { label: 'Inquiries', value: s.totalInquiries },
                { label: 'Quotations', value: s.totalQuotations },
                { label: 'Sale Orders', value: s.totalSaleOrders },
                { label: 'Overdue', value: s.overdueInvoices, warn: s.overdueInvoices > 0 },
            ]
        },
        {
            title: 'Purchase', route: '/purchase', items: [
                { label: 'Vendors', value: s.totalVendors },
                { label: 'POs', value: s.totalPurchaseOrders },
                { label: 'Pending POs', value: s.pendingPOs, warn: s.pendingPOs > 0 },
                { label: 'GRNs', value: s.totalGRNs },
                { label: 'Bills', value: s.totalBills },
                { label: 'Unpaid', value: s.unpaidBills, warn: s.unpaidBills > 0 },
            ]
        },
        {
            title: 'Production', route: '/production', items: [
                { label: 'Products', value: s.totalProducts },
                { label: 'BOMs', value: s.totalBOMs },
                { label: 'Route Cards', value: s.totalRouteCards },
                { label: 'Reports', value: s.totalReports },
                { label: 'Job Orders', value: s.totalJobOrders },
            ]
        },
        {
            title: 'HR', route: '/hr', items: [
                { label: 'Employees', value: s.totalEmployees },
                { label: 'Salary Sheets', value: s.totalSalarySheets },
                { label: 'Pending Adv.', value: s.pendingAdvances, warn: s.pendingAdvances > 0 },
            ]
        },
        {
            title: 'Finance', route: '/finance', items: [
                { label: 'Vouchers', value: s.totalVouchers },
                { label: 'Bank Recon', value: s.totalBankReconciliations },
                { label: 'Credit Cards', value: s.totalCreditCards },
            ]
        },
        {
            title: 'Quality', route: '/quality', items: [
                { label: 'IQC', value: s.totalIQC },
                { label: 'MTS', value: s.totalMTS },
                { label: 'PQC', value: s.totalPQC },
                { label: 'PDI', value: s.totalPDI },
                { label: 'QRD', value: s.totalQRD },
            ]
        },
        {
            title: 'Warehouse', route: '/warehouse', items: [
                { label: 'Warehouses', value: s.totalWarehouses },
                { label: 'Transfers', value: s.totalTransfers },
            ]
        },
        {
            title: 'Logistics', route: '/logistics', items: [
                { label: 'Transporters', value: s.totalTransporters },
                { label: 'Dispatches', value: s.totalDispatches },
            ]
        },
        {
            title: 'Maintenance', route: '/maintenance', items: [
                { label: 'Tools', value: s.totalTools },
                { label: 'Scheduled', value: s.scheduledMaintenance },
                { label: 'Calibrations', value: s.totalCalibrations },
                { label: 'Rectify', value: s.totalRectifications },
            ]
        },
        {
            title: 'Contractors', route: '/contractors', items: [
                { label: 'Workers', value: s.totalContractWorkers },
                { label: 'Sal. Sheets', value: s.totalContractorSheets },
            ]
        },
        {
            title: 'Assets', route: '/assets', items: [
                { label: 'Assets', value: s.totalAssets },
                { label: 'Depreciation', value: s.totalDepreciation },
            ]
        },
        {
            title: 'Statutory', route: '/statutory', items: [
                { label: 'GST Master', value: s.totalGSTMaster },
            ]
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <div className="page-header-actions">
                    <button className="btn btn-ghost btn-sm">Export Report</button>
                </div>
            </div>

            {/* ── Top KPI strip ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap', width: '100%', overflowX: 'auto', paddingBottom: 4 }}>
                <KPI icon={DollarSign} label="Revenue" value={s.totalRevenue} isCurrency />
                <KPI icon={FileText} label="Invoices" value={s.totalInvoices} />
                <KPI icon={Users} label="Customers" value={s.totalCustomers} />
                <KPI icon={Package} label="Vendors" value={s.totalVendors} />
                <KPI icon={Factory} label="Products" value={s.totalProducts} />
                <KPI icon={Users} label="Employees" value={s.totalEmployees} />
                <KPI icon={AlertTriangle} label="Overdue" value={s.overdueInvoices} isDanger />
            </div>

            {/* ── Module cards grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '20px 0' }}>
                {moduleGroups.map(g => <ModuleCard key={g.title} {...g} />)}
            </div>

            {/* ── Charts row (synced with real data) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Module Activity Bar Chart */}
                <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>Records per Module</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={moduleSummary} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Records" fill="#6B7280" radius={[3, 3, 0, 0]} barSize={24}>
                                {moduleSummary.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Invoice Status Pie (live) */}
                <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>Invoice Status</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={invoicePie} cx="50%" cy="50%"
                                innerRadius={45} outerRadius={75}
                                paddingAngle={2} dataKey="value" nameKey="name"
                                label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                    if (percent < 0.05) return null;
                                    const R = Math.PI / 180;
                                    const r = outerRadius + 22;
                                    const x = cx + r * Math.cos(-midAngle * R);
                                    const y = cy + r * Math.sin(-midAngle * R);
                                    return <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>{`${name} (${(percent * 100).toFixed(0)}%)`}</text>;
                                }}
                                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                            >
                                {invoicePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="card">
                <div className="card-header"><span className="card-title">Quick Actions</span></div>
                <div className="quick-actions-grid">
                    {[
                        { label: 'New Inquiry', to: '/sales' },
                        { label: 'New Purchase Order', to: '/purchase' },
                        { label: 'Production Report', to: '/production' },
                        { label: 'Run Simulation', to: '/simulation' },
                        { label: 'Generate Payroll', to: '/hr' },
                        { label: 'Finance Vouchers', to: '/finance' },
                        { label: 'Quality Check', to: '/quality' },
                        { label: 'Maintenance', to: '/maintenance' },
                        { label: 'View Reports', to: '/reports' },
                    ].map(a => (
                        <Link to={a.to} key={a.label} className="btn btn-ghost quick-action-btn">{a.label}</Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
