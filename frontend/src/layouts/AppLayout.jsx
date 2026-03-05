import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ShoppingCart, Package, Factory, Calculator, DollarSign, Users, CheckCircle, Warehouse, FileText, Truck, HardHat, Wrench, Building2, LayoutDashboard, ChevronRight, LogOut, Bell, Menu, FileBarChart } from 'lucide-react';
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

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
    const { user, logout, hasPermission } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect mobile breakpoint
    useEffect(() => {
        const onResize = () => {
            const mobile = window.innerWidth < 769;
            setIsMobile(mobile);
            if (!mobile) setSidebarOpen(true); // on desktop always show
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Close sidebar on route change (mobile only)
    useEffect(() => {
        if (isMobile) setSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Sidebar class logic: desktop=collapsed/open, mobile=hidden/open overlay
    const sidebarClass = isMobile
        ? `sidebar ${sidebarOpen ? 'open' : ''}`
        : `sidebar ${sidebarOpen ? '' : 'collapsed'}`;

    return (
        <div className="app-layout">
            {/* Mobile backdrop */}
            {isMobile && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 99, backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <aside className={sidebarClass} style={{ zIndex: 100 }}>
                <div className="sidebar-logo">
                    <BarChart3 size={28} style={{ color: 'var(--blue-light)', flexShrink: 0 }} />
                    {(sidebarOpen || !isMobile) && sidebarOpen && <h1>TechMicra ERP</h1>}
                </div>
                <nav className="sidebar-nav">
                    {navGroups.map((group) => (
                        <div className="nav-group" key={group.label}>
                            {sidebarOpen && <div className="nav-group-label">{group.label}</div>}
                            {group.items.filter(item => !item.permission || hasPermission(item.permission)).map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                    <item.icon size={20} />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="main-content" style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)'), transition: 'margin-left 0.3s ease' }}>
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="btn btn-ghost btn-sm hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '8px' }}>
                            <Menu size={20} />
                        </button>
                        <div className="breadcrumb">
                            <span>TechMicra ERP</span>
                            <ChevronRight size={14} />
                            <span>Dashboard</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <button className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: '8px' }}>
                            <Bell size={20} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar">{user?.name?.[0] || 'A'}</div>
                            {sidebarOpen && !isMobile && <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.name}</span>}
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ padding: '8px' }}>
                            <LogOut size={18} />
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

