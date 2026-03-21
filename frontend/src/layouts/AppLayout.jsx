import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ShoppingCart, Package, Factory, Calculator, DollarSign, Users, CheckCircle, Warehouse, FileText, Truck, Wrench, Building2, HardHat, LayoutDashboard, ChevronRight, LogOut, Bell, Menu, Settings, FileBarChart, X, AlertTriangle, Loader2 } from 'lucide-react';
import useAuthStore from '../lib/auth';
import AIInsideButton from '../components/ai/AIInsideButton';
import api from '../lib/api';

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

import useUIStore from '../lib/uiStore';

export default function AppLayout() {

    const aiPanelOpen = useUIStore(state => state.aiPanelOpen);

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifError, setNotifError] = useState(null);
    const pollRef = useRef(null);

    const { user, logout, hasPermission, permissions } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // ── Fetch notifications from real API ─────────────────────────────────────
    const fetchNotifications = async () => {
        try {
            setNotifError(null);
            const res = await api.get('/notifications');
            if (res.data?.success) {
                setNotifications(res.data.data || []);
            }
        } catch (err) {
            setNotifError('Failed to load notifications');
        } finally {
            setNotifLoading(false);
        }
    };

    useEffect(() => {
        setNotifLoading(true);
        fetchNotifications();
        // Poll every 60 seconds to pick up new alerts
        pollRef.current = setInterval(fetchNotifications, 60_000);
        return () => clearInterval(pollRef.current);
    }, []);

    const isSalesUser = permissions && !permissions.includes('*') && hasPermission('sales.view') && !hasPermission('purchase.view') && !hasPermission('production.view') && !hasPermission('finance.view');

    const displayNavGroups = isSalesUser ? [
        {
            label: 'Overview', items: [
                { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
            ]
        },
        {
            label: 'Sales Operations', items: [
                { to: '/sales?tab=customers', icon: Users, label: 'Customers' },
                { to: '/sales?tab=inquiries', icon: FileText, label: 'Inquiries' },
                { to: '/sales?tab=quotations', icon: FileText, label: 'Quotations' },
                { to: '/sales?tab=sale-orders', icon: ShoppingCart, label: 'Sale Orders' },
                { to: '/sales?tab=dispatch-advices', icon: Truck, label: 'Dispatch Advices' },
                { to: '/sales?tab=invoices', icon: FileText, label: 'Invoices' },
                { to: '/sales?tab=collections', icon: AlertTriangle, label: 'Collections' },
                { to: '/sales?tab=receipts', icon: DollarSign, label: 'Receipts' },
            ]
        }
    ] : navGroups;

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

    const dismissNotif = async (id) => {
        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await api.delete(`/notifications/${encodeURIComponent(id)}`);
        } catch (err) {
            // Restore state if API call failed
            fetchNotifications();
        }
    };

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
        } catch (err) {
            // Silent fail – UI already updated optimistically
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        try {
            await api.post('/notifications/read-all');
        } catch (err) {
            fetchNotifications();
        }
    };

    const blurStyle = aiPanelOpen ? {
        filter: 'blur(3px)',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'all 300ms ease'
    } : {
        transition: 'all 300ms ease'
    };

    const [sidebarLocalOpen, setSidebarLocalOpen] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="app-layout">
            <aside className={`sidebar ${sidebarLocalOpen ? '' : 'collapsed'}`} style={blurStyle}>
                <div className="sidebar-logo">
                    <BarChart3 size={22} strokeWidth={1.5} style={{ color: 'var(--gray-700)' }} />
                    {sidebarLocalOpen && <h1>TechMicra ERP</h1>}
                </div>
                <nav className="sidebar-nav">
                    {displayNavGroups.map((group) => {
                        const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div className="nav-group" key={group.label}>
                                {sidebarLocalOpen && <div className="nav-group-label">{group.label}</div>}
                                {visibleItems.map((item) => {
                                    const isQueryMatch = item.to.includes('?')
                                        ? location.pathname === item.to.split('?')[0] && location.search.includes(item.to.split('?')[1])
                                        : location.pathname === item.to && location.search === '';

                                    return (
                                        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isQueryMatch || (isActive && !item.to.includes('?')) ? 'active' : ''}`}>
                                            <item.icon size={18} strokeWidth={1.5} />
                                            {sidebarLocalOpen && <span>{item.label}</span>}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
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
                            <button
                                className="btn btn-ghost btn-sm notif-trigger"
                                onClick={() => setNotifOpen(!notifOpen)}
                                style={{ position: 'relative', padding: '8px' }}
                            >
                                <Bell size={18} strokeWidth={1.5} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '4px', right: '4px',
                                        minWidth: '16px', height: '16px',
                                        borderRadius: '999px', padding: '0 3px',
                                        background: 'var(--red, #DC2626)',
                                        border: '2px solid var(--bg-primary, #0F172A)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '9px', fontWeight: 700, color: '#fff',
                                        lineHeight: 1,
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
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
                                        {/* Header */}
                                        <div style={{
                                            padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <strong style={{ fontSize: '14px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Notifications
                                                {unreadCount > 0 && (
                                                    <span style={{
                                                        background: '#DC2626', color: '#fff',
                                                        borderRadius: '999px', fontSize: '11px',
                                                        padding: '1px 7px', fontWeight: 600
                                                    }}>
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </strong>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {notifLoading && (
                                                    <Loader2 size={13} style={{
                                                        color: '#9ca3af',
                                                        animation: 'spin 1s linear infinite'
                                                    }} />
                                                )}
                                                <span
                                                    style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}
                                                    onClick={clearAll}
                                                >
                                                    Clear all
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                            {/* Error state */}
                                            {notifError && (
                                                <div style={{
                                                    padding: '16px', textAlign: 'center',
                                                    color: '#DC2626', fontSize: '12px',
                                                    display: 'flex', alignItems: 'center',
                                                    gap: '6px', justifyContent: 'center'
                                                }}>
                                                    <AlertTriangle size={14} />
                                                    {notifError}
                                                    <span
                                                        style={{ color: '#6b7280', textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px' }}
                                                        onClick={fetchNotifications}
                                                    >
                                                        Retry
                                                    </span>
                                                </div>
                                            )}

                                            {/* Loading state (initial) */}
                                            {!notifError && notifLoading && notifications.length === 0 && (
                                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                                    Loading…
                                                </div>
                                            )}

                                            {/* Empty state */}
                                            {!notifError && !notifLoading && notifications.length === 0 && (
                                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                                    No new notifications
                                                </div>
                                            )}

                                            {/* Notification items */}
                                            {notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    style={{
                                                        padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                                                        display: 'flex', justifyContent: 'space-between',
                                                        alignItems: 'flex-start', gap: '8px',
                                                        cursor: 'pointer', transition: 'background 0.15s',
                                                        background: n.read ? '#f9fafb' : '#ffffff',
                                                        opacity: n.read ? 0.7 : 1,
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '#f9fafb' : '#ffffff'}
                                                    onClick={() => {
                                                        markAsRead(n.id);
                                                        if (n.link) { navigate(n.link); setNotifOpen(false); }
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontSize: '13px', fontWeight: 500, marginBottom: '4px',
                                                            color: n.type === 'warning' ? '#D97706' : '#1f2937'
                                                        }}>
                                                            {n.title}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{n.time}</div>
                                                    </div>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ padding: '2px', minWidth: 'auto', color: '#6b7280', flexShrink: 0 }}
                                                        onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                                                    >
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
                            {sidebarLocalOpen && <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name}</span>}
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
