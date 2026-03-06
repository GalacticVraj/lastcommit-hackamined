import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Edit, Trash2, Loader2, Printer, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DataTable from '../components/DataTable';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import RecordViewPanel from '../components/RecordViewPanel';
import RecordEditModal from '../components/RecordEditModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ProfileLink from '../components/ProfileLink';
import FinanceDashboard from '../components/FinanceDashboard';
import HRDashboard from '../components/HRDashboard';
import OperationsDashboard from '../components/OperationsDashboard';
import LogisticsDashboard from '../components/LogisticsDashboard';
import MaintenanceDashboard from '../components/MaintenanceDashboard';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

/**
 * GenericModulePage — used for Purchase, HR, Finance, Quality, Production etc.
 * 
 * Props:
 *   title       string
 *   apiBase     string          e.g. "/purchase"
 *   statCards   []              dashboard stat config
 *   tabs        [{key, label, endpoint, columns, viewFields, editFields, formFields, sections?, deletePermission?, statusActions?}]
 */
export default function GenericModulePage({ title, apiBase, statCards = [], tabs = [] }) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'list');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Query params
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Create
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [dynamicOptions, setDynamicOptions] = useState({});

    // View
    const [viewRecord, setViewRecord] = useState(null);

    // Edit
    const [editRecord, setEditRecord] = useState(null);

    // Confirm dialog
    const [confirm, setConfirm] = useState({ open: false, loading: false });

    const currentTab = tabs.find(t => t.key === activeTab) || {};
    const moduleName = apiBase.replace('/', '');
    const isOperationsModule = ['/quality', '/contractors', '/warehouse', '/assets'].includes(apiBase);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const res = await api.get(`${apiBase}/dashboard`);
                setStats(res.data.data.stats);
            } else if (currentTab?.endpoint) {
                const params = {
                    page,
                    per_page: 25,
                    search,
                    sort_by: sortBy,
                    sort_order: sortOrder
                };
                const res = await api.get(`${apiBase}${currentTab.endpoint}`, { params });
                setData(res.data.data || []);
                setTotal(res.data.pagination?.total || (res.data.data?.length || 0));
            }
        } catch { console.error('Failed to load'); }
        setLoading(false);
    }, [activeTab, page, search, sortBy, sortOrder, currentTab.endpoint, apiBase]);

    useEffect(() => {
        setPage(1); // Reset page on tab change
    }, [activeTab]);

    useEffect(() => { loadData(); }, [loadData]);

    // Load dynamic options for form fields with optionsEndpoint
    const loadDynamicOptions = useCallback(async () => {
        const fields = currentTab.formFields || [];
        const endpointsToFetch = fields.filter(f => f.optionsEndpoint && !dynamicOptions[f.optionsEndpoint]);
        
        for (const field of endpointsToFetch) {
            try {
                const res = await api.get(field.optionsEndpoint);
                const items = res.data.data || res.data || [];
                setDynamicOptions(prev => ({
                    ...prev,
                    [field.optionsEndpoint]: items.map(item => ({
                        value: field.optionsValue ? item[field.optionsValue] : item.id,
                        label: field.optionsLabel ? item[field.optionsLabel] : item.name || item.empCode || String(item.id)
                    }))
                }));
            } catch (err) {
                console.error(`Failed to load options from ${field.optionsEndpoint}:`, err);
            }
        }
    }, [currentTab.formFields, dynamicOptions]);

    // Load dynamic options when create form opens
    useEffect(() => {
        if (showCreate) loadDynamicOptions();
    }, [showCreate, loadDynamicOptions]);

    // Handle auto-population when a field with autoPopulateEndpoint changes
    const handleAutoPopulate = async (field, value) => {
        if (!field.autoPopulateEndpoint || !value) return;
        
        try {
            // Replace {value} placeholder in endpoint with actual selected value
            const endpoint = field.autoPopulateEndpoint.replace('{value}', value);
            const res = await api.get(endpoint);
            const data = res.data.data;
            
            if (data && field.autoPopulateMap) {
                // autoPopulateMap: { 'calculated.grossSalary': 'grossSalary', 'calculated.pfDeduction': 'pfDeduction', ... }
                const updates = {};
                for (const [sourcePath, targetField] of Object.entries(field.autoPopulateMap)) {
                    // Get nested value from source path like 'calculated.grossSalary'
                    const pathParts = sourcePath.split('.');
                    let val = data;
                    for (const part of pathParts) {
                        val = val?.[part];
                    }
                    if (val !== undefined) updates[targetField] = val;
                }
                setCreateForm(prev => ({ ...prev, ...updates }));
            }
        } catch (err) {
            console.error('Auto-populate failed:', err);
        }
    };

    // Fetch full record for view panel
    const handleViewOpen = async (item) => {
        setViewRecord(item);
        try {
            const res = await api.get(`${apiBase}${currentTab.endpoint}/${item.id}`);
            setViewRecord(res.data.data);
        } catch { /* keep partial */ }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`${apiBase}${currentTab?.endpoint || ''}`, createForm);
            toast.success('Created successfully');
            setShowCreate(false);
            setCreateForm({});
            loadData();
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        setSubmitting(false);
    };

    const handleDelete = (item) => {
        setConfirm({
            open: true, loading: false,
            title: 'Delete Record',
            message: 'Are you sure you want to delete this record? This cannot be undone.',
            confirmLabel: 'Delete', confirmClass: 'btn-danger',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, loading: true }));
                try {
                    await api.delete(`${apiBase}${currentTab.endpoint}/${item.id}`);
                    toast.success('Record deleted');
                    setConfirm({ open: false, loading: false });
                    loadData();
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error deleting');
                    setConfirm(c => ({ ...c, loading: false }));
                }
            }
        });
    };

    const handleStatusAction = (item, action) => {
        setConfirm({
            open: true, loading: false,
            title: action.label,
            message: action.confirmMessage,
            confirmLabel: action.label, confirmClass: action.class || 'btn-primary',
            onConfirm: async () => {
                setConfirm(c => ({ ...c, loading: true }));
                try {
                    await api.put(`${apiBase}${currentTab.endpoint}/${item.id}`, { status: action.status });
                    toast.success(`Status updated to ${action.status}`);
                    setConfirm({ open: false, loading: false });
                    setData(prev => prev.map(r => r.id === item.id ? { ...r, status: action.status } : r));
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Error updating status');
                    setConfirm(c => ({ ...c, loading: false }));
                }
            }
        });
    };

    const getNestedValue = (obj, path) => path?.split('.').reduce((o, k) => o?.[k], obj);

    // Prepare columns for DataTable component
    const columns = currentTab.columns?.map(colKey => ({
        key: colKey,
        label: colKey.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^\w/, ch => ch.toUpperCase()),
        sortable: true,
        render: (item) => {
            const val = colKey.includes('.') ? getNestedValue(item, colKey) : item[colKey];

            if (colKey === 'vendor.name') return <ProfileLink id={item.vendorId} name={val} type="vendor" />;
            if (activeTab === 'vendors' && colKey === 'name') return <ProfileLink id={item.id} name={val} type="vendor" />;
            if (colKey === 'employee.name') return <ProfileLink id={item.employeeId} name={val} type="employee" />;
            if (activeTab === 'employees' && colKey === 'name') return <ProfileLink id={item.id} name={val} type="employee" />;
            if (colKey === 'customer.name') return <ProfileLink id={item.customerId} name={val} type="customer" />;
            if (activeTab === 'customers' && colKey === 'name') return <ProfileLink id={item.id} name={val} type="customer" />;
            if (colKey === 'salesman.name' || colKey === 'salesPerson') return <ProfileLink id={item.salesmanId || item.salesPerson} name={val} type="salesman" />;
            if (activeTab === 'salesmen' && colKey === 'name') return <ProfileLink id={item.id} name={val} type="salesman" />;

            if (colKey === 'status') {
                const statusClass = val?.toLowerCase().replace(/\s+/g, '-') || 'active';
                return <span className={`badge badge-${statusClass}`}>{val}</span>;
            }
            if (typeof val === 'number' && val > 999) return `₹${val.toLocaleString()}`;
            return val ?? '—';
        }
    })) || [];

    const actions = (item) => (
        <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-ghost btn-sm" title="View" style={{ padding: '4px 8px' }}
                onClick={() => handleViewOpen(item)}>
                <Eye size={14} />
            </button>

            {currentTab.hasPrint && currentTab.printType && (
                <button
                    className="btn btn-ghost btn-sm"
                    title="Print"
                    style={{ padding: '4px 8px' }}
                    onClick={() => window.open(`/print/${currentTab.printType}/${item.id}`, '_blank')}
                >
                    <Printer size={14} />
                </button>
            )}

            <PermissionGate permission={`${moduleName}.edit`}>
                <button className="btn btn-ghost btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                    onClick={() => setEditRecord(item)}>
                    <Edit size={14} />
                </button>
            </PermissionGate>

            {(currentTab.statusActions || []).map(action => {
                if (item.status === action.status) return null;
                const isApprove = action.status === 'Approved';
                const isCancel = action.status === 'Cancelled';
                const iconColor = isApprove ? '#059669' : isCancel ? '#DC2626' : undefined;
                const ActionIcon = isApprove ? Check : isCancel ? X : null;
                return (
                    <PermissionGate key={action.label} permission={`${moduleName}.edit`}>
                        <button className="btn btn-ghost btn-sm"
                            title={action.label} 
                            style={{ padding: '4px 8px', color: iconColor }}
                            onClick={() => handleStatusAction(item, action)}>
                            {ActionIcon ? <ActionIcon size={14} /> : action.label}
                        </button>
                    </PermissionGate>
                );
            })}

            <PermissionGate permission={currentTab.deletePermission || `${moduleName}.delete`}>
                <button className="btn btn-ghost btn-sm" title="Delete"
                    style={{ padding: '4px 8px', color: 'var(--danger)' }}
                    onClick={() => handleDelete(item)}>
                    <Trash2 size={14} />
                </button>
            </PermissionGate>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h1>{title}</h1>
                {activeTab !== 'dashboard' && (
                    <PermissionGate permission={`${moduleName}.create`}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={16} /> New</button>
                    </PermissionGate>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.key} className={`btn ${t.key === activeTab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Dashboard - Finance gets special component, others get stats grid */}
            {activeTab === 'dashboard' && apiBase === '/finance' && (
                <FinanceDashboard />
            )}

            {/* Dashboard - HR gets special component */}
            {activeTab === 'dashboard' && apiBase === '/hr' && (
                <HRDashboard />
            )}

            {/* Dashboard - Operations modules get chart visualizations */}
            {activeTab === 'dashboard' && apiBase === '/logistics' && (
                <LogisticsDashboard />
            )}

            {activeTab === 'dashboard' && apiBase === '/maintenance' && (
                <MaintenanceDashboard />
            )}

            {/* Dashboard - Operations modules get chart visualizations */}
            {activeTab === 'dashboard' && isOperationsModule && (
                <OperationsDashboard apiBase={apiBase} title={title} stats={stats} />
            )}

            {/* Dashboard stats for other modules */}
            {activeTab === 'dashboard' && apiBase !== '/finance' && apiBase !== '/hr' && apiBase !== '/logistics' && apiBase !== '/maintenance' && !isOperationsModule && stats && (
                <div className="stats-grid">
                    {Object.entries(stats).map(([key, value]) => (
                        <div className="stat-card" key={key}>
                            <div><div className="stat-value">{typeof value === 'number' && value > 9999 ? `₹${(value / 100000).toFixed(1)}L` : value}</div><div className="stat-label">{key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}</div></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Data table */}
            {activeTab !== 'dashboard' && (
                <DataTable
                    data={data}
                    columns={columns}
                    loading={loading}
                    total={total}
                    page={page}
                    perPage={25}
                    onPageChange={setPage}
                    onSearch={setSearch}
                    onSort={(col, dir) => { setSortBy(col); setSortOrder(dir); }}
                    onNew={() => setShowCreate(true)}
                    moduleName={moduleName}
                    actions={actions}
                    searchValue={search}
                />
            )}

            {/* View slide-over */}
            <RecordViewPanel
                open={!!viewRecord}
                onClose={() => setViewRecord(null)}
                onEdit={() => { setEditRecord(viewRecord); setViewRecord(null); }}
                title={`${currentTab.label || 'Record'} Details`}
                record={viewRecord}
                fields={currentTab.viewFields || Object.keys(viewRecord || {}).filter(k => typeof (viewRecord || {})[k] !== 'object').map(k => ({ key: k, label: k.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase()) }))}
                sections={currentTab.sections || []}
                canEdit={true}
            />

            {/* Edit modal */}
            <RecordEditModal
                open={!!editRecord}
                onClose={() => setEditRecord(null)}
                onSaved={loadData}
                record={editRecord}
                endpoint={`${apiBase}${currentTab.endpoint || ''}`}
                fields={currentTab.editFields || currentTab.formFields || []}
                title={`Edit ${currentTab.label || 'Record'}`}
            />

            {/* Confirm dialog */}
            <ConfirmDialog
                open={confirm.open}
                onClose={() => setConfirm({ open: false, loading: false })}
                onConfirm={confirm.onConfirm}
                title={confirm.title}
                message={confirm.message}
                confirmLabel={confirm.confirmLabel}
                confirmClass={confirm.confirmClass}
                loading={confirm.loading}
            />

            {/* Create modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Record</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {(currentTab.formFields || [{ name: 'name', label: 'Name' }]).map(f => (
                                        <div className="form-group" key={f.name}>
                                            <label className="form-label">{f.label}</label>
                                            {f.type === 'select' ? (
                                                <select className="form-input" required={f.required}
                                                    value={createForm[f.name] || ''}
                                                    onChange={e => {
                                                        const newValue = e.target.value;
                                                        setCreateForm({ ...createForm, [f.name]: newValue });
                                                        // Auto-populate related fields if configured
                                                        if (f.autoPopulateEndpoint) handleAutoPopulate(f, newValue);
                                                    }}>
                                                    <option value="">Select {f.label}</option>
                                                    {f.optionsEndpoint 
                                                        ? (dynamicOptions[f.optionsEndpoint] || []).map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))
                                                        : (f.options || []).map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))
                                                    }
                                                </select>
                                            ) : (
                                                <input className="form-input" type={f.type || 'text'} required={f.required}
                                                    value={createForm[f.name] || ''}
                                                    onChange={e => setCreateForm({ ...createForm, [f.name]: e.target.value })} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {currentTab.hasItems && (
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4>Line Items</h4>
                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreateForm(prev => ({ ...prev, items: [...(prev.items || []), { productId: '', quantity: 1, rate: 0, gstPercent: 18 }] }))}>
                                                <Plus size={14} /> Add Row
                                            </button>
                                        </div>
                                        <table className="data-table" style={{ fontSize: '12px' }}>
                                            <thead><tr><th>Product ID</th><th>Qty</th><th>Rate</th><th>GST %</th><th></th></tr></thead>
                                            <tbody>
                                                {(createForm.items || []).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td><input className="form-input" style={{ width: '80px', padding: '4px' }} type="number" required value={item.productId} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].productId = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="1" value={item.quantity} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].quantity = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '80px', padding: '4px' }} type="number" required min="0" step="0.01" value={item.rate} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].rate = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><input className="form-input" style={{ width: '60px', padding: '4px' }} type="number" required min="0" value={item.gstPercent} onChange={e => {
                                                            const newItems = [...createForm.items];
                                                            newItems[idx].gstPercent = e.target.value;
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }} /></td>
                                                        <td><button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => {
                                                            const newItems = createForm.items.filter((_, i) => i !== idx);
                                                            setCreateForm({ ...createForm, items: newItems });
                                                        }}><Trash2 size={14} /></button></td>
                                                    </tr>
                                                ))}
                                                {(!createForm.items || createForm.items.length === 0) && (
                                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No items added</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                                <PermissionGate permission={`${moduleName}.create`}>
                                    <button type="submit" className="btn btn-primary" disabled={submitting} style={{ gap: '8px' }}>
                                        {submitting && <Loader2 size={16} className="animate-spin" />}
                                        {submitting ? 'Creating...' : 'Create'}
                                    </button>
                                </PermissionGate>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
