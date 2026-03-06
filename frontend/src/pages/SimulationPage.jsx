import { useState, useEffect } from 'react';
import {
    Calculator, Loader2, Hammer, Package, Clock,
    TrendingUp, History, Save, Plus, Trash2,
    AlertTriangle, CheckCircle2, ChevronRight,
    ArrowRight, Info
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Theme Colors
const COLORS = {
    primary: '#E8720C',      // Orange Primary
    primaryLight: '#F5924A', // Orange Light
    secondary: '#C9860A',    // Gold Accent
    bg: '#FAFAF8',          // Primary Background
    card: '#EFEFEB',        // Card Background
    border: '#E2DDD6',      // Border Color
    textMuted: '#9C9488',   // Muted Text
    textBody: '#3D3A35',    // Body Text
    textHeading: '#1C1A17', // Heading Text
    success: '#4A7C59',     // Success Green
    error: '#DC2626',       // Standard Error Red
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.primaryLight];

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
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'

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

    const costData = result ? [
        { name: 'Labor', value: result.cost_breakdown.labor },
        { name: 'Material', value: result.cost_breakdown.material },
        { name: 'Electricity', value: result.cost_breakdown.electricity },
    ] : [];

    return (
        <div className="min-h-screen p-6" style={{ background: COLORS.bg, color: COLORS.textBody, fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1" style={{ color: COLORS.textHeading }}>Production Simulation</h1>
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>MRP, CRP & Forecasting Environment</p>
                </div>
                <div className="flex bg-white rounded-full p-1 shadow-sm border" style={{ borderColor: COLORS.border }}>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        style={activeTab === 'new' ? { background: COLORS.primary } : {}}
                    >
                        New Simulation
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        style={activeTab === 'history' ? { background: COLORS.primary } : {}}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Panel: Inputs */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className="bg-white rounded-2xl p-6 shadow-sm border" style={{ borderColor: COLORS.border }}>
                            <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: COLORS.border }}>
                                <Hammer className="text-orange-600" size={20} style={{ color: COLORS.primary }} />
                                <h2 className="text-lg font-semibold" style={{ color: COLORS.textHeading }}>Simulation Parameters</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Shift Hours</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={shiftHours}
                                            onChange={(e) => setShiftHours(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm font-medium"
                                            style={{ borderColor: COLORS.border, background: '#F9F9F7' }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Worker Count</label>
                                    <div className="relative">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={workerCount}
                                            onChange={(e) => setWorkerCount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all text-sm font-medium"
                                            style={{ borderColor: COLORS.border, background: '#F9F9F7' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 mt-8">
                                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Master Production Schedule</label>
                                <button
                                    onClick={addMpsRow}
                                    className="text-orange-600 hover:text-orange-700 text-xs font-bold flex items-center gap-1"
                                    style={{ color: COLORS.primary }}
                                >
                                    <Plus size={14} /> Add Product
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {mps.map((row, idx) => (
                                    <div key={idx} className="group flex gap-3 p-3 rounded-xl border bg-white hover:shadow-md transition-all relative" style={{ borderColor: COLORS.border }}>
                                        <div className="flex-1 space-y-2">
                                            <select
                                                value={row.productId}
                                                onChange={(e) => updateMpsRow(idx, 'productId', e.target.value)}
                                                className="w-full bg-transparent outline-none text-sm font-semibold cursor-pointer"
                                                style={{ color: COLORS.textHeading }}
                                            >
                                                <option value="">Select Finished Good...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                                ))}
                                            </select>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    value={row.targetQty}
                                                    onChange={(e) => updateMpsRow(idx, 'targetQty', e.target.value)}
                                                    className="w-20 bg-gray-50 px-2 py-1 rounded text-xs font-bold border outline-none"
                                                    style={{ borderColor: COLORS.border }}
                                                />
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Target Qty</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeMpsRow(idx)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all absolute top-2 right-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={runSimulation}
                                disabled={loading}
                                className="w-full mt-8 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-orange-300 transform active:scale-[0.98] transition-all disabled:grayscale"
                                style={{ background: COLORS.primary }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Calculator />}
                                {loading ? 'Computing Simulation...' : 'Run Simulation'}
                            </button>
                        </section>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="lg:col-span-7">
                        {!result ? (
                            <div className="h-full min-h-[500px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-12" style={{ borderColor: COLORS.border }}>
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4" style={{ background: '#FEF0E6' }}>
                                    <TrendingUp className="text-orange-300" size={40} style={{ color: COLORS.primaryLight }} />
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.textHeading }}>Results Environment Ready</h3>
                                <p className="text-sm max-w-xs" style={{ color: COLORS.textMuted }}>Define your MPS and parameters on the left to generate real-time MRP, CRP, and cost breakdown.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* Summary Bar */}
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Completion', val: result.summary.days_required + ' Days', icon: Clock, color: 'blue' },
                                        { label: 'Readiness', val: result.summary.material_readiness_pct + '%', icon: Package, color: 'green' },
                                        { label: 'Total Cost', val: '₹' + (result.cost_breakdown.total / 100000).toFixed(1) + 'L', icon: Calculator, color: 'orange' },
                                        { label: 'Est. Date', val: result.summary.estimated_completion, icon: TrendingUp, color: 'purple' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border shadow-sm" style={{ borderColor: COLORS.border }}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <stat.icon size={14} className="text-gray-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
                                            </div>
                                            <div className="text-lg font-black" style={{ color: COLORS.textHeading }}>{stat.val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Cost Donut */}
                                    <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: COLORS.border }}>
                                        <h3 className="text-sm font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                                            Cost Distribution
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={costData}
                                                        cx="50%" cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={8}
                                                        dataKey="value"
                                                    >
                                                        {costData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Capacity Gauge */}
                                    <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: COLORS.border }}>
                                        <h3 className="text-sm font-bold uppercase tracking-tight mb-4">Capacity Analysis</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: COLORS.border }}>
                                                <span className="text-xs text-gray-500 font-medium">Total Man-Hours Req.</span>
                                                <span className="text-sm font-bold">{result.summary.total_man_hours.toLocaleString()}h</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: COLORS.border }}>
                                                <span className="text-xs text-gray-500 font-medium">Daily Plant Capacity</span>
                                                <span className="text-sm font-bold">{(workerCount * shiftHours).toLocaleString()}h</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b pb-2" style={{ borderColor: COLORS.border }}>
                                                <span className="text-xs text-gray-500 font-medium">Effective Utilization</span>
                                                <span className="text-sm font-bold text-orange-600" style={{ color: COLORS.primary }}>Target 100%</span>
                                            </div>

                                            {result.summary.overload_alert ? (
                                                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3 mt-4">
                                                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                                    <p className="text-[10px] text-red-700 font-bold leading-tight uppercase">
                                                        CRITICAL: Capacity Overload Detected. Estimated production exceeds standard 30-day window. Add workers or shifts.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 mt-4">
                                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                                                    <p className="text-[10px] text-emerald-700 font-bold leading-tight uppercase">
                                                        CAPACITY OK: Production plan fits within sustainable schedule. No immediate hiring required.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* MRP Breakdown Table */}
                                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.border }}>
                                    <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50" style={{ borderColor: COLORS.border }}>
                                        <h3 className="text-sm font-bold uppercase tracking-tight">Material Requirements (MRP)</h3>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] uppercase font-bold text-gray-400">Ready</span></div>
                                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] uppercase font-bold text-gray-400">Shortfall</span></div>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-white shadow-sm border-b" style={{ borderColor: COLORS.border, zIndex: 10 }}>
                                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    <th className="px-6 py-4">Required Item</th>
                                                    <th className="px-6 py-4">Parent Product</th>
                                                    <th className="px-6 py-4">Needed</th>
                                                    <th className="px-6 py-4">Available</th>
                                                    <th className="px-6 py-4 text-right">Shortfall</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                                                {result.material_breakdown.map((mat, i) => (
                                                    <tr key={i} className={`hover:bg-gray-50 transition-colors ${mat.shortfall > 0 ? 'bg-red-50/30' : ''}`}>
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${mat.shortfall > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                                                <span className="font-semibold text-sm" style={{ color: COLORS.textHeading }}>{mat.material_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3.5 text-xs font-medium text-gray-500">{mat.parent_name}</td>
                                                        <td className="px-6 py-3.5 text-xs font-bold">{mat.required_qty} {mat.unit}</td>
                                                        <td className="px-6 py-3.5 text-xs font-bold text-gray-500">{mat.available_qty}</td>
                                                        <td className="px-6 py-3.5 text-right">
                                                            <span className={`text-xs font-black ${mat.shortfall > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {mat.shortfall > 0 ? mat.shortfall : 'OK'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Save Bar */}
                                <div className="bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm" style={{ borderColor: COLORS.border }}>
                                    <input
                                        type="text"
                                        value={simulationName}
                                        onChange={(e) => setSimulationName(e.target.value)}
                                        placeholder="Simulation Name (e.g., Q2 Main Batch)"
                                        className="flex-1 bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold border outline-none focus:ring-2"
                                        style={{ borderColor: COLORS.border }}
                                    />
                                    <button
                                        onClick={saveToHistory}
                                        disabled={loading}
                                        className="bg-zinc-800 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all disabled:grayscale"
                                    >
                                        <Save size={16} /> Save Result
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 max-w-5xl mx-auto">
                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                            <p className="text-gray-400 font-medium">Loading simulation archives...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border" style={{ borderColor: COLORS.border }}>
                            <History className="mx-auto text-gray-200 mb-4" size={64} />
                            <p className="text-gray-400 font-bold uppercase tracking-widest">No history found</p>
                        </div>
                    ) : (
                        history.map((sim, i) => (
                            <div
                                key={i}
                                onClick={() => loadFromHistory(sim)}
                                className="group bg-white p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between"
                                style={{ borderColor: COLORS.border }}
                            >
                                <div className="flex gap-6 items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                                        <Calculator className="text-gray-400 group-hover:text-orange-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-0.5" style={{ color: COLORS.textHeading }}>{sim.simulation_name}</h4>
                                        <div className="flex gap-3 items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{new Date(sim.createdAt || sim.created_at).toLocaleDateString()}</span>
                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{sim.days_required} Days Plan</span>
                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500" style={{ color: COLORS.primary }}>₹{(sim.total_cost / 100000).toFixed(1)}L Total</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">Status</div>
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${sim.material_readiness_pct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {sim.material_readiness_pct === 100 ? 'Fully Ready' : `Ready: ${sim.material_readiness_pct}%`}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" size={24} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2DDD6;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}

