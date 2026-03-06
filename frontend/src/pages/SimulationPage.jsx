import { useState, useEffect } from 'react';
import {
    Calculator, Loader2, Hammer, Package, Clock,
    TrendingUp, History, Save, Plus, Trash2,
    AlertTriangle, CheckCircle2, ChevronRight,
    ArrowRight, Info, Sparkles, Zap, BrainCircuit,
    Calendar, Activity, Layers, DollarSign
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#EA580C', '#F59E0B', '#6366F1', '#10B981'];

export default function SimulationPage() {
    const [products, setProducts] = useState([]);
    const [mps, setMps] = useState([{ productId: '', targetQty: 1 }]);
    const [shiftHours, setShiftHours] = useState(10);
    const [workerCount, setWorkerCount] = useState(50);
    const [simulationName, setSimulationName] = useState('');

    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('new');
    const [aiInsights, setAiInsights] = useState('');
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchHistory();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/simulation/products-with-bom');
            setProducts(res.data.data);
        } catch (e) {
            toast.error('Failed to load products');
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/simulation/history');
            setHistory(res.data.data.data);
        } catch (e) {
            toast.error('Failed to load history');
        }
        setHistoryLoading(false);
    };

    const addMpsRow = () => setMps([...mps, { productId: '', targetQty: 1 }]);
    const removeMpsRow = (index) => setMps(mps.filter((_, i) => i !== index));
    const updateMpsRow = (index, field, value) => {
        const updated = [...mps];
        updated[index][field] = value;
        setMps(updated);
    };

    const runSimulation = async () => {
        const validMps = mps.filter(m => m.productId && m.targetQty > 0);
        if (!validMps.length) return toast.error('Please add at least one valid product');

        setLoading(true);
        try {
            const payload = {
                mps: validMps,
                shiftHours: parseFloat(shiftHours),
                workerCount: parseInt(workerCount)
            };
            const res = await api.post('/simulation/run', payload);
            setResult(res.data.data);
            setSimulationName(`Sim_${new Date().toLocaleTimeString()}`);
            toast.success('Simulation Completed');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Calculation failed');
        }
        setLoading(false);
    };

    const saveToHistory = async () => {
        if (!result) return;
        setLoading(true);
        try {
            const payload = {
                ...result,
                simulation_name: simulationName,
                shift_hours: shiftHours,
                worker_count: workerCount,
                mps: mps.filter(m => m.productId && m.targetQty > 0)
            };
            await api.post('/simulation/save', payload);
            toast.success('Simulation saved to history');
            fetchHistory();
        } catch (e) {
            toast.error('Failed to save simulation');
        }
        setLoading(false);
    };

    const loadFromHistory = async (sim) => {
        setResult(sim);
        setSimulationName(sim.simulation_name);
        setShiftHours(sim.shift_hours);
        setWorkerCount(sim.worker_count);
        setActiveTab('new');
        toast.success(`Loaded ${sim.simulation_name}`);
    };

    const getAIInsights = async () => {
        if (!result) return;
        setGeneratingAI(true);
        try {
            const res = await api.post('/ai/summarize', {
                type: 'simulation_forecast',
                data: result
            });
            setAiInsights(res.data.data.summary);
            toast.success('AI Analysis Complete');
        } catch (e) {
            toast.error('AI Service currently busy');
        }
        setGeneratingAI(false);
    };

    const costData = result ? [
        { name: 'Labor', value: result.cost_breakdown.labor },
        { name: 'Material', value: result.cost_breakdown.material },
        { name: 'Electricity', value: result.cost_breakdown.electricity },
    ] : [];

    return (
        <div className="page-content">
            {/* Header with Tabs */}
            <div className="page-header">
                <div>
                    <h1>Production Simulation</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Strategic Capacity Planning & Impact Assessment
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setActiveTab('new')}
                    >
                        New Simulation
                    </button>
                    <button
                        className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        onClick={() => setActiveTab('history')}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="grid-2" style={{ gridTemplateColumns: 'minmax(400px, 450px) 1fr', alignItems: 'start' }}>
                    {/* Input Panel */}
                    <div className="card glass" style={{ position: 'sticky', top: '20px' }}>
                        <div className="card-header">
                            <span className="card-title">Configuration</span>
                            <Layers size={16} className="text-muted" />
                        </div>

                        <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Shift Hours</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ paddingLeft: '36px' }}
                                        value={shiftHours}
                                        onChange={(e) => setShiftHours(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Workers</label>
                                <div style={{ position: 'relative' }}>
                                    <Hammer size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ paddingLeft: '36px' }}
                                        value={workerCount}
                                        onChange={(e) => setWorkerCount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Production Schedule (MPS)</label>
                            <button className="btn btn-ghost btn-sm" onClick={addMpsRow} style={{ padding: '4px 8px' }}>
                                <Plus size={14} /> Add Product
                            </button>
                        </div>

                        <div className="custom-scrollbar" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                            {mps.map((row, idx) => (
                                <div key={idx} className="glass" style={{ padding: '12px', borderRadius: '12px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            className="form-input"
                                            style={{ fontSize: '13px' }}
                                            value={row.productId}
                                            onChange={(e) => updateMpsRow(idx, 'productId', e.target.value)}
                                        >
                                            <option value="">{products.length === 0 ? 'Loading products...' : 'Select Finished Good...'}</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                            ))}
                                        </select>
                                        <div style={{ width: '80px', flexShrink: 0 }}>
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ fontSize: '13px', textAlign: 'center' }}
                                                value={row.targetQty}
                                                onChange={(e) => updateMpsRow(idx, 'targetQty', e.target.value)}
                                                placeholder="Qty"
                                            />
                                        </div>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '8px' }} onClick={() => removeMpsRow(idx)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '20px', justifyContent: 'center', padding: '14px' }}
                            onClick={runSimulation}
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
                            {loading ? 'Crunching Numbers...' : 'Run Simulation'}
                        </button>
                    </div>

                    {/* Results Panel */}
                    <div>
                        {!result ? (
                            <div className="card glass flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: '500px' }}>
                                <div style={{ background: 'rgba(234, 88, 12, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '16px' }}>
                                    <TrendingUp size={48} style={{ color: '#EA580C' }} />
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Ready to Simulate</h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '280px', margin: '8px auto' }}>
                                    Provide your master schedule parameters on the left to analyze production feasibility.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-in fade-in slide-in-from-bottom-2">
                                {/* Stats Row */}
                                <div className="stats-grid">
                                    {[
                                        { label: 'Completion', value: `${result.summary.days_required} Days`, icon: Calendar },
                                        { label: 'Material Readiness', value: `${result.summary.material_readiness_pct}%`, icon: Package },
                                        { label: 'Forecasted Cost', value: `₹${(result.cost_breakdown.total / 100000).toFixed(1)}L`, icon: DollarSign },
                                        { label: 'Est. End Date', value: result.summary.estimated_completion, icon: Clock },
                                    ].map((s, i) => (
                                        <div key={i} className="stat-card glass">
                                            <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.4)' }}><s.icon size={16} /></div>
                                            <div>
                                                <div className="stat-value" style={{ fontSize: '16px' }}>{s.value}</div>
                                                <div className="stat-label">{s.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid-2">
                                    {/* Cost Pie */}
                                    <div className="card glass">
                                        <div className="card-header">
                                            <span className="card-title">Cost Composition</span>
                                        </div>
                                        <div style={{ height: '220px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={costData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                                        {costData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />)}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '12px' }} />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Capacity Check */}
                                    <div className="card glass">
                                        <div className="card-header">
                                            <span className="card-title">Resource Load</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Man-Hours Needed</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{result.summary.total_man_hours.toLocaleString()}h</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Daily Plant Flow</span>
                                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{(workerCount * shiftHours).toLocaleString()}h</span>
                                            </div>

                                            {result.summary.overload_alert ? (
                                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                    <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                                                    <p style={{ fontSize: '11px', color: '#991B1B', fontWeight: 500 }}>
                                                        <strong>Overload:</strong> Target date exceeds 30-day feasibility window. Requires workforce expansion.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                    <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                                    <p style={{ fontSize: '11px', color: '#065F46', fontWeight: 500 }}>
                                                        <strong>Optimal:</strong> Production volume is manageable with current staffing levels.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* MRP Details */}
                                <div className="table-container glass">
                                    <div className="card-header" style={{ padding: '16px 20px', marginBottom: 0 }}>
                                        <span className="card-title">Material Strategy (MRP)</span>
                                    </div>
                                    <div className="custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="data-table">
                                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Required</th>
                                                    <th>Stock</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.material_breakdown.map((mat, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: 600 }}>{mat.material_name}</td>
                                                        <td>{mat.required_qty} {mat.unit}</td>
                                                        <td>{mat.available_qty}</td>
                                                        <td>
                                                            <span className={`badge ${mat.shortfall > 0 ? 'badge-rejected' : 'badge-paid'}`}>
                                                                {mat.shortfall > 0 ? `Short: ${mat.shortfall}` : 'Ready'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Save Bar & AI */}
                                <div className="card glass">
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Assign a Name (e.g., April Batch B)..."
                                            value={simulationName}
                                            onChange={(e) => setSimulationName(e.target.value)}
                                        />
                                        <button className="btn btn-ghost" onClick={saveToHistory}>
                                            <Save size={16} /> Save
                                        </button>
                                    </div>

                                    <div style={{ marginTop: '20px', padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(234, 88, 12, 0.05) 100%)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <BrainCircuit size={20} style={{ color: 'var(--primary)' }} />
                                            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>AI Strategic Summary</h4>
                                        </div>

                                        {!aiInsights ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    Get a high-level executive summary and actionable recommendations from our AI engine.
                                                </p>
                                                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'start' }} onClick={getAIInsights} disabled={generatingAI}>
                                                    {generatingAI ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                                    {generatingAI ? 'Analyzing...' : 'Generate Analysis'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="animate-in zoom-in-95">
                                                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)', background: 'white', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                                                    {aiInsights}
                                                </div>
                                                <button className="btn btn-link btn-sm" style={{ marginTop: '8px' }} onClick={() => setAiInsights('')}>Clear</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* History Tab */
                <div className="card glass">
                    <div className="card-header">
                        <span className="card-title">Saved Archives</span>
                        <History size={16} className="text-muted" />
                    </div>

                    {historyLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Retrieving archived models...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No simulations saved yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {history.map((sim, i) => (
                                <div
                                    key={i}
                                    className="glass hover:shadow-md transition-all cursor-pointer"
                                    style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)' }}
                                    onClick={() => loadFromHistory(sim)}
                                >
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ background: 'white', padding: '10px', borderRadius: '12px' }}>
                                            <Calculator size={20} style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{sim.simulation_name}</h4>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {new Date(sim.createdAt || sim.created_at).toLocaleDateString()} • {sim.days_required} Day Plan • ₹{(sim.total_cost / 100000).toFixed(1)}L
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span className={`badge ${sim.material_readiness_pct === 100 ? 'badge-paid' : 'badge-pending'}`}>
                                            {sim.material_readiness_pct}% Ready
                                        </span>
                                        <ChevronRight size={18} className="text-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
            `}</style>
        </div>
    );
}

