import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#2563EB', '#0D9488', '#D97706', '#DC2626', '#8B5CF6'];

export default function GenericModulePage({ title, apiBase, statCards = [], tabs = [] }) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.key || 'list');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({});

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const res = await api.get(`${apiBase}/dashboard`);
                setStats(res.data.data.stats);
            } else {
                const tab = tabs.find(t => t.key === activeTab);
                if (tab?.endpoint) {
                    const res = await api.get(`${apiBase}${tab.endpoint}`);
                    setData(res.data.data || []);
                }
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const tab = tabs.find(t => t.key === activeTab);
            await api.post(`${apiBase}${tab?.endpoint || ''}`, form);
            toast.success('Created successfully');
            setShowModal(false);
            setForm({});
            loadData();
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    };

    const currentTab = tabs.find(t => t.key === activeTab) || {};

    return (
        <div>
            <div className="page-header">
                <h1>{title}</h1>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus size={16} /> New</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.key} className={`btn ${t.key === activeTab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'dashboard' && stats && (
                <div className="stats-grid">
                    {Object.entries(stats).map(([key, value]) => (
                        <div className="stat-card" key={key}>
                            <div><div className="stat-value">{typeof value === 'number' && value > 9999 ? `₹${(value / 100000).toFixed(1)}L` : value}</div><div className="stat-label">{key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}</div></div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab !== 'dashboard' && (
                <div className="table-container">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr>{(currentTab.columns || ['id']).map(c => <th key={c}>{c.replace(/([A-Z])/g, ' $1').replace(/^\w/, ch => ch.toUpperCase())}</th>)}</tr></thead>
                            <tbody>
                                {loading ? [1, 2, 3].map(i => <tr key={i}>{(currentTab.columns || ['id']).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 20 }} /></td>)}</tr>) :
                                    data.map(item => (
                                        <tr key={item.id}>{(currentTab.columns || ['id']).map(col => {
                                            const val = col.includes('.') ? col.split('.').reduce((o, k) => o?.[k], item) : item[col];
                                            if (col === 'status') return <td key={col}><span className="badge badge-active">{val}</span></td>;
                                            if (typeof val === 'number' && val > 999) return <td key={col}>₹{val.toLocaleString()}</td>;
                                            return <td key={col}>{val ?? '—'}</td>;
                                        })}</tr>
                                    ))
                                }
                                {!loading && !data.length && <tr><td colSpan={currentTab.columns?.length || 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>New Record</h2><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body">
                                {(currentTab.formFields || [{ name: 'name', label: 'Name' }]).map(f => (
                                    <div className="form-group" key={f.name}>
                                        <label className="form-label">{f.label}</label>
                                        <input className="form-input" type={f.type || 'text'} required={f.required}
                                            value={form[f.name] || ''} onChange={e => setForm({ ...form, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
