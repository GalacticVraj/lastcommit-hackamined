import { useState, useEffect } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

export default function SimulationPage() {
    const [products, setProducts] = useState([]);
    const [inputs, setInputs] = useState([{ productId: '', targetQty: '' }]);
    const [shiftHours, setShiftHours] = useState(10);
    const [workerCount, setWorkerCount] = useState(50);
    const [laborRate, setLaborRate] = useState(250);
    const [kwhRate, setKwhRate] = useState(8);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/production/products?per_page=100').then(res => {
            setProducts(res.data.data.filter(p => p.category === 'Finished Good'));
        });
    }, []);

    const addRow = () => setInputs([...inputs, { productId: '', targetQty: '' }]);
    const removeRow = (i) => setInputs(inputs.filter((_, idx) => idx !== i));
    const updateInput = (i, field, value) => {
        const updated = [...inputs];
        updated[i][field] = field === 'targetQty' || field === 'productId' ? Number(value) : value;
        setInputs(updated);
    };

    const runSimulation = async () => {
        const validInputs = inputs.filter(i => i.productId && i.targetQty > 0);
        if (!validInputs.length) return toast.error('Add at least one product with quantity');
        setLoading(true);
        try {
            const res = await api.post('/simulation/run', { inputs: validInputs, shiftHours, workerCount, laborRate, kwhRate });
            setResult(res.data.data);
            toast.success('Simulation completed!');
        } catch (e) { toast.error(e.response?.data?.message || 'Simulation failed'); }
        setLoading(false);
    };

    const costDonut = result ? [
        { name: 'Labor', value: result.costBreakdown.laborCost },
        { name: 'Electricity', value: result.costBreakdown.electricityCost },
        { name: 'Material', value: result.costBreakdown.materialCost },
    ] : [];

    return (
        <div>
            <div className="page-header">
                <h1>Production Simulation & Forecasting</h1>
            </div>

            {/* MPS Input Grid */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header"><span className="card-title">Master Production Schedule (MPS)</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Shift Hours</label>
                        <input className="form-input" type="number" value={shiftHours} onChange={e => setShiftHours(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Worker Count</label>
                        <input className="form-input" type="number" value={workerCount} onChange={e => setWorkerCount(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Labor Rate (₹/hr)</label>
                        <input className="form-input" type="number" value={laborRate} onChange={e => setLaborRate(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Energy Rate (₹/kWh)</label>
                        <input className="form-input" type="number" value={kwhRate} onChange={e => setKwhRate(Number(e.target.value))} />
                    </div>
                </div>
                <table className="data-table" style={{ marginBottom: '16px' }}>
                    <thead><tr><th>Product</th><th>Target Quantity</th><th></th></tr></thead>
                    <tbody>
                        {inputs.map((input, i) => (
                            <tr key={i}>
                                <td>
                                    <select className="form-select" value={input.productId} onChange={e => updateInput(i, 'productId', e.target.value)}>
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </select>
                                </td>
                                <td><input className="form-input" type="number" min="1" placeholder="Qty" value={input.targetQty} onChange={e => updateInput(i, 'targetQty', e.target.value)} /></td>
                                <td><button className="btn btn-ghost btn-sm" onClick={() => removeRow(i)} style={{ color: 'var(--red)' }}>✕</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={addRow}>+ Add Product</button>
                    <button className="btn btn-primary" onClick={runSimulation} disabled={loading}>
                        {loading && <Loader2 size={18} className="spin" />}
                        Run Simulation
                    </button>
                </div>
            </div>

            {/* Results */}
            {result && (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon blue"><Calculator size={24} /></div>
                            <div><div className="stat-value">₹{(result.costBreakdown.totalCost / 100000).toFixed(2)}L</div><div className="stat-label">Total Estimated Cost</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon teal"><Calculator size={24} /></div>
                            <div><div className="stat-value">{result.crpSummary.daysRequired.toFixed(1)}</div><div className="stat-label">Days Required</div></div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon amber"><Calculator size={24} /></div>
                            <div><div className="stat-value">{result.materialReadinessPercent.toFixed(0)}%</div><div className="stat-label">Material Readiness</div></div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        {/* Cost Breakdown Donut */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">Cost Breakdown</span></div>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={costDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                                        label={({ name, value }) => `${name}: ₹${(value / 1000).toFixed(0)}K`}>
                                        {costDonut.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={(v) => `₹${v.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* CRP Summary */}
                        <div className="card">
                            <div className="card-header"><span className="card-title">Capacity Requirements (CRP)</span></div>
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Man-Hours</span><strong>{result.crpSummary.totalManHours.toLocaleString()} hrs</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Total Machine-Hours</span><strong>{result.crpSummary.totalMachineHours.toLocaleString()} hrs</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Workers</span><strong>{result.crpSummary.workerCount}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Shift Duration</span><strong>{result.crpSummary.shiftHours} hrs/day</strong>
                                    </div>
                                    {result.crpSummary.daysRequired > 22 && (
                                        <div style={{ padding: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '8px', color: 'var(--red-light)', fontWeight: 600 }}>
                                            ⚠️ OVERLOAD: Target cannot be met within one month!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MRP Materials Table */}
                    <div className="table-container">
                        <div className="table-toolbar">
                            <span className="card-title">Material Requirements (MRP Breakdown)</span>
                        </div>
                        <table className="data-table">
                            <thead><tr><th>Material</th><th>Required Qty</th><th>Available Qty</th><th>Shortfall</th><th>Unit Cost</th><th>Total Cost</th></tr></thead>
                            <tbody>
                                {result.mrpBreakdown.map((mat, i) => (
                                    <tr key={i} style={mat.shortfall > 0 ? { background: 'rgba(220, 38, 38, 0.08)' } : {}}>
                                        <td style={{ fontWeight: 500 }}>{mat.materialName}</td>
                                        <td>{mat.requiredQty.toLocaleString()}</td>
                                        <td>{mat.availableQty.toLocaleString()}</td>
                                        <td style={{ color: mat.shortfall > 0 ? 'var(--red)' : 'var(--teal)', fontWeight: 600 }}>
                                            {mat.shortfall > 0 ? `-${mat.shortfall.toLocaleString()}` : '✓ OK'}
                                        </td>
                                        <td>₹{mat.unitCost.toLocaleString()}</td>
                                        <td>₹{mat.totalCost.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
