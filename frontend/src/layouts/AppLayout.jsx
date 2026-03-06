import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ShoppingCart, Package, Factory, Calculator, DollarSign, Users, CheckCircle, Warehouse, FileText, Truck, Wrench, Building2, HardHat, LayoutDashboard, ChevronRight, LogOut, Bell, Menu, Settings, FileBarChart, X } from 'lucide-react';
import useAuthStore from '../lib/auth';

const navGroups = [
    {
        label: 'Overview', items: [
            { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        ]
    },
    {
        label: 'Core Modules', items: [
            { to: '/sales', icon: ShoppingCart, label: 'Sales', permission: 'sales.view' },
            { to: '/purchase', icon: Package, label: 'Purchase', permission: 'purchase.view' },
            { to: '/production', icon: Factory, label: 'Production', permission: 'production.view' },
            { to: '/simulation', icon: Calculator, label: 'Simulation', permission: 'simulation.view' },
        ]
    },
    {
        label: 'Finance & HR', items: [
            { to: '/finance', icon: DollarSign, label: 'Finance', permission: 'finance.view' },
            { to: '/hr', icon: Users, label: 'HR', permission: 'hr.view' },
        ]
    },
    {
        label: 'Operations', items: [
            { to: '/quality', icon: CheckCircle, label: 'Quality', permission: 'quality.view' },
            { to: '/warehouse', icon: Warehouse, label: 'Warehouse', permission: 'warehouse.view' },
            { to: '/logistics', icon: Truck, label: 'Logistics', permission: 'logistics.view' },
            { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.view' },
            { to: '/maintenance', icon: Wrench, label: 'Maintenance', permission: 'maintenance.view' },
            { to: '/assets', icon: Building2, label: 'Assets', permission: 'assets.view' },
        ]
    },
    {
        label: 'Compliance', items: [
            { to: '/statutory', icon: FileText, label: 'Statutory/GST', permission: 'statutory.view' },
            { to: '/reports', icon: FileBarChart, label: 'Reports' },
        ]
    },
];

// Map route paths to readable names for breadcrumb
const routeLabels = {
    '/': 'Dashboard', '/sales': 'Sales', '/purchase': 'Purchase',
    '/production': 'Production', '/simulation': 'Simulation', '/finance': 'Finance',
    '/hr': 'HR', '/quality': 'Quality',
    '/warehouse': 'Warehouse', '/logistics': 'Logistics', '/contractors': 'Contractors', '/maintenance': 'Maintenance',
    '/assets': 'Assets', '/statutory': 'Statutory/GST', '/reports': 'Reports',
};

// Sample notifications (replace with real API later)
const SAMPLE_NOTIFICATIONS = [
    { id: 1, title: 'Invoice #INV-0042 overdue', time: '2 hours ago', type: 'warning', link: '/sales?tab=invoices', read: false },
    { id: 2, title: 'New inquiry received from customer', time: '5 hours ago', type: 'info', link: '/sales?tab=inquiries', read: false },
    { id: 3, title: 'GRN #GRN-0018 pending IQC', time: '1 day ago', type: 'info', link: '/quality?tab=iqc', read: false },
    { id: 4, title: 'PO #PO-0031 delivery delayed', time: '2 days ago', type: 'warning', link: '/purchase?tab=orders', read: false },
    { id: 5, title: 'Voucher #VCH-0125 pending approval', time: '3 hours ago', type: 'info', link: '/finance?tab=vouchers', read: false },
    { id: 6, title: 'Employee leave request pending', time: '4 hours ago', type: 'info', link: '/hr?tab=leaves', read: false },
    { id: 7, title: 'Low stock alert: Steel Rods', time: '6 hours ago', type: 'warning', link: '/warehouse?tab=dashboard', read: false },
    { id: 8, title: 'Shipment #SHP-0089 in transit', time: '1 day ago', type: 'info', link: '/logistics?tab=shipments', read: false },
    { id: 9, title: 'Machine #M-005 maintenance due', time: '2 days ago', type: 'warning', link: '/maintenance?tab=schedules', read: false },
    { id: 10, title: 'Asset depreciation report ready', time: '3 days ago', type: 'info', link: '/assets?tab=dashboard', read: false },
    { id: 11, title: 'GST return filing due this week', time: '1 day ago', type: 'warning', link: '/statutory?tab=gst', read: false },
];

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
    const { user, logout, hasPermission } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentLabel = routeLabels[location.pathname] || location.pathname.replace('/', '').replace(/^\w/, c => c.toUpperCase());

    // Close notification panel when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (notifOpen && !e.target.closest('.notif-panel') && !e.target.closest('.notif-trigger')) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [notifOpen]);

    const dismissNotif = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <div className="app-layout">
            <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                <div className="sidebar-logo">
                    <BarChart3 size={22} strokeWidth={1.5} style={{ color: 'var(--gray-700)' }} />
                    {sidebarOpen && <h1>TechMicra ERP</h1>}
                </div>
                <nav className="sidebar-nav">
                    {navGroups.map((group) => (
                        <div className="nav-group" key={group.label}>
                            {sidebarOpen && <div className="nav-group-label">{group.label}</div>}
                            {group.items.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <item.icon size={18} strokeWidth={1.5} />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '8px' }}>
                            <Menu size={18} strokeWidth={1.5} />
                        </button>
                        <div className="breadcrumb">
                            <span>TechMicra ERP</span>
                            <ChevronRight size={14} />
                            <span>{currentLabel}</span>
                        </div>
                    </div>
                    <div className="header-right">
                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button className="btn btn-ghost btn-sm notif-trigger" onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative', padding: '8px' }}>
                                <Bell size={18} strokeWidth={1.5} />
                                {notifications.some(n => !n.read) && (
                                    <span style={{
                                        position: 'absolute', top: '4px', right: '4px',
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: 'var(--red, #DC2626)', border: '2px solid var(--bg-primary, #0F172A)'
                                    }} />
                                )}
                            </button>
                            {notifOpen && (
                                <>
                                    {/* Blurred backdrop */}
                                    <div style={{
                                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                                        zIndex: 1099
                                    }} onClick={() => setNotifOpen(false)} />
                                    {/* Notification panel */}
                                    <div className="notif-panel" style={{
                                        position: 'absolute', top: '100%', right: 0, width: '340px',
                                        background: '#ffffff', border: '1px solid #e5e7eb',
                                        borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                        zIndex: 1100, marginTop: '8px', overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '14px', color: '#1f2937' }}>Notifications</strong>
                                            <span style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }} onClick={() => setNotifications([])}>Clear all</span>
                                        </div>
                                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                            {notifications.length === 0 && (
                                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>No notifications</div>
                                            )}
                                            {notifications.map(n => (
                                                <div key={n.id} style={{
                                                    padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                                                    cursor: 'pointer', transition: 'background 0.15s',
                                                    background: n.read ? '#f9fafb' : '#ffffff',
                                                    opacity: n.read ? 0.7 : 1,
                                                }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '#f9fafb' : '#ffffff'}
                                                    onClick={() => { markAsRead(n.id); if (n.link) { navigate(n.link); setNotifOpen(false); } }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: n.type === 'warning' ? '#D97706' : '#1f2937' }}>{n.title}</div>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{n.time}</div>
                                                    </div>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px', minWidth: 'auto', color: '#6b7280' }} onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar">{user?.name?.[0] || 'A'}</div>
                            {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name}</span>}
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ padding: '8px' }}>
                            <LogOut size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </header>
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
