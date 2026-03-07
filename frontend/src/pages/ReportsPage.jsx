import { useState, useEffect } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import GlassSelect from '../components/GlassSelect';
import GlassDatePicker from '../components/GlassDatePicker';

const REPORT_TYPES = [
    { value: 'sales-register', label: 'Sales Register' },
    { value: 'purchase-register', label: 'Purchase Register' },
    { value: 'stock-ledger', label: 'Stock Ledger' },
    { value: 'outstanding-receivables', label: 'Outstanding Receivables Ageing' },
    { value: 'outstanding-payables', label: 'Outstanding Payables Ageing' },
    { value: 'daily-production', label: 'Daily Production Report' },
    { value: 'material-consumption', label: 'Material Consumption Report' },
    { value: 'gst-summary', label: 'GST Summary' },
    { value: 'payroll-summary', label: 'Payroll Summary' },
    { value: 'collection-efficiency', label: 'Collection Efficiency' },
    { value: 'vendor-performance', label: 'Vendor Performance' },
    { value: 'inventory-valuation', label: 'Inventory Valuation' },
    { value: 'job-work-summary', label: 'Job Work Summary' },
    { value: 'asset-depreciation', label: 'Asset Depreciation Schedule' },
    { value: 'pnl', label: 'Profit & Loss Statement' },
    { value: 'balance-sheet', label: 'Balance Sheet' },
    { value: 'bank-reconciliation', label: 'Bank Reconciliation Summary' },
    { value: 'tds-tcs', label: 'TDS/TCS Summary' },
    { value: 'simulation-result', label: 'Production Simulation Result' },
    { value: 'communication-log', label: 'Communication Log Report' },
];

export default function ReportsPage() {
    const [reportType, setReportType] = useState('sales-register');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const res = await api.get(`/reports/${reportType}?${params.toString()}`);
            setData(res.data.data);
        } catch (e) { toast.error('Failed to load report'); }
        setLoading(false);
    };

    const exportCSV = () => {
        if (!data) return;
        const rows = Array.isArray(data) ? data : [data];
        if (!rows.length) return;
        const headers = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('CSV exported');
    };

    useEffect(() => { loadReport(); }, [reportType]);

    const renderData = () => {
        if (!data) return null;
        if (!Array.isArray(data)) {
            return (
                <div className="stats-grid">
                    {Object.entries(data).map(([key, value]) => (
                        <div className="stat-card" key={key}>
                            <div>
                                <div className="stat-value">{typeof value === 'number' && value > 999 ? `₹${(value / 100000).toFixed(2)}L` : typeof value === 'number' ? value.toLocaleString() : String(value)}</div>
                                <div className="stat-label">{key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}</div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        if (!data.length) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data for this report</div>;
        const cols = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' && k !== 'id' && k !== 'deletedAt' && k !== 'createdBy' && k !== 'updatedBy' && k !== 'isActive');
        return (
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead><tr>{cols.map(c => <th key={c}>{c.replace(/([A-Z])/g, ' $1').replace(/^\w/, ch => ch.toUpperCase())}</th>)}</tr></thead>
                    <tbody>
                        {data.slice(0, 50).map((row, i) => (
                            <tr key={i}>{cols.map(c => {
                                let val = row[c];
                                if (typeof val === 'number' && (c.toLowerCase().includes('amount') || c.toLowerCase().includes('total') || c.toLowerCase().includes('cost') || c.toLowerCase().includes('value') || c.toLowerCase().includes('salary') || c.toLowerCase().includes('pay'))) val = `₹${val.toLocaleString()}`;
                                if (c === 'status') return <td key={c}><span className="badge badge-active">{val}</span></td>;
                                return <td key={c}>{val ?? '—'}</td>;
                            })}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <div className="page-header">
                <h1>Reports</h1>
                <div className="page-header-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={16} /> Print</button>
                    <button className="btn btn-ghost btn-sm" onClick={exportCSV}><Download size={16} /> Export CSV</button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label className="form-label">Report Type</label>
                        <GlassSelect 
                            value={reportType} 
                            onChange={e => setReportType(e.target.value)}
                            options={REPORT_TYPES}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">From Date</label>
                        <GlassDatePicker value={from} onChange={e => setFrom(e.target.value)} placeholder="Select from date" />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">To Date</label>
                        <GlassDatePicker value={to} onChange={e => setTo(e.target.value)} placeholder="Select to date" />
                    </div>
                    <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
                        <FileText size={16} /> Generate
                    </button>
                </div>
            </div>

            <div className="table-container" style={{ padding: loading ? '20px' : 0 }}>
                {loading ? <div className="skeleton" style={{ height: 200 }} /> : renderData()}
            </div>
        </div>
    );
}
