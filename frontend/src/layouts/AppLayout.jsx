import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ShoppingCart, Package, Factory, Calculator, DollarSign, Users, CheckCircle, Warehouse, FileText, Truck, HardHat, Wrench, Building2, LayoutDashboard, ChevronRight, LogOut, Bell, Menu, Settings, FileBarChart, X } from 'lucide-react';
import useAuthStore from '../lib/auth';
import AIInsideButton from '../components/ai/AIInsideButton';

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
            { to: '/contractors', icon: HardHat, label: 'Contractors', permission: 'contractors.view' },
        ]
    },
    {
        label: 'Operations', items: [
            { to: '/quality', icon: CheckCircle, label: 'Quality', permission: 'quality.view' },
            { to: '/warehouse', icon: Warehouse, label: 'Warehouse', permission: 'warehouse.view' },
            { to: '/logistics', icon: Truck, label: 'Logistics', permission: 'logistics.view' },
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
    '/hr': 'HR', '/contractors': 'Contractors', '/quality': 'Quality',
    '/warehouse': 'Warehouse', '/logistics': 'Logistics', '/maintenance': 'Maintenance',
    '/assets': 'Assets', '/statutory': 'Statutory/GST', '/reports': 'Reports',
};

// Sample notifications (replace with real API later)
const SAMPLE_NOTIFICATIONS = [
    { id: 1, title: 'Invoice #INV-0042 overdue', time: '2 hours ago', type: 'warning' },
    { id: 2, title: 'New inquiry received from customer', time: '5 hours ago', type: 'info' },
    { id: 3, title: 'GRN #GRN-0018 pending IQC', time: '1 day ago', type: 'info' },
    { id: 4, title: 'PO #PO-0031 delivery delayed', time: '2 days ago', type: 'warning' },
];

import useUIStore from '../lib/uiStore';

export default function AppLayout() {
    const { sidebarOpen, setSidebarOpen } = useState(true); // Assuming this might be local but I'll check
    // Wait, the original Sidebar doesn't have a state here, it uses the local useState.
    // I need to be careful not to break existing sidebar toggle.

    // Actually, I'll just use the store for aiPanelOpen.
    const aiPanelOpen = useUIStore(state => state.aiPanelOpen);

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

    const blurStyle = aiPanelOpen ? {
        filter: 'blur(4px)',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'all 300ms ease'
    } : {
        transition: 'all 300ms ease'
    };

    const [sidebarLocalOpen, setSidebarLocalOpen] = useState(true);

    return (
        <div className="app-layout">
            <aside className={`sidebar ${sidebarLocalOpen ? '' : 'collapsed'}`} style={blurStyle}>
                <div className="sidebar-logo">
                    <BarChart3 size={22} strokeWidth={1.5} style={{ color: 'var(--gray-700)' }} />
                    {sidebarLocalOpen && <h1>TechMicra ERP</h1>}
                </div>
                <nav className="sidebar-nav">
                    {navGroups.map((group) => (
                        <div className="nav-group" key={group.label}>
                            {sidebarLocalOpen && <div className="nav-group-label">{group.label}</div>}
                            {group.items.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <item.icon size={18} strokeWidth={1.5} />
                                    {sidebarLocalOpen && <span>{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className={`main-content ${sidebarLocalOpen ? '' : 'sidebar-collapsed'}`} style={blurStyle}>
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSidebarLocalOpen(!sidebarLocalOpen)} style={{ padding: '8px' }}>
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
                                {notifications.length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '4px', right: '4px',
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: 'var(--red, #DC2626)', border: '2px solid var(--bg-primary, #0F172A)'
                                    }} />
                                )}
                            </button>
                            {notifOpen && (
                                <div className="notif-panel" style={{
                                    position: 'absolute', top: '100%', right: 0, width: '340px',
                                    background: 'var(--bg-secondary, #1E293B)', border: '1px solid var(--border, #334155)',
                                    borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                                    zIndex: 1100, marginTop: '8px', overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ fontSize: '14px' }}>Notifications</strong>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setNotifications([])}>Clear all</span>
                                    </div>
                                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                        {notifications.length === 0 && (
                                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No notifications</div>
                                        )}
                                        {notifications.map(n => (
                                            <div key={n.id} style={{
                                                padding: '12px 16px', borderBottom: '1px solid var(--border, #334155)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                                                cursor: 'pointer', transition: 'background 0.15s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: n.type === 'warning' ? 'var(--amber, #D97706)' : 'var(--text-primary)' }}>{n.title}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.time}</div>
                                                </div>
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '2px', minWidth: 'auto' }} onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
            <AIInsideButton />
        </div>
    );
}
