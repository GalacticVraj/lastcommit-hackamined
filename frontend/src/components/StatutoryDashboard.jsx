import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RefreshCw, FileText, FileCheck, Landmark, BadgePercent, ReceiptText, ScrollText } from 'lucide-react';
import api from '../lib/api';

const COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74'];

const formatCurrency = (value) => {
  const n = Number(value || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const useCountUp = (end, duration = 900) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const target = Number(end || 0);
    if (target === 0) {
      setCount(0);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

const KPICard = ({ icon: Icon, label, value }) => {
  const animated = useCountUp(value, 850);
  return (
    <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
      <div className="stat-icon" style={{
        background: 'var(--glass-bg)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={20} color="#6B7280" strokeWidth={1.5} />
      </div>
      <div style={{ flexShrink: 0 }}>
        <div style={{ color: '#000', fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{animated}</div>
        <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
};

export default function StatutoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/statutory/dashboard');
        if (!mounted) return;
        const payload = res?.data?.data || {};
        setStats(payload.stats || {});
        setCharts(Array.isArray(payload.charts) ? payload.charts : []);
        setRecent(Array.isArray(payload.recent) ? payload.recent : []);
      } catch (error) {
        console.error('Failed to load statutory dashboard', error);
      }
      if (mounted) setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
        <RefreshCw size={30} className="animate-spin" style={{ color: '#F97316' }} />
      </div>
    );
  }

  const chartMap = (charts || []).reduce((acc, chart) => {
    acc[chart.key] = chart.data || [];
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap', width: '100%' }}>
        <KPICard icon={BadgePercent} label="GST Master" value={stats.totalGstEntries || 0} />
        <KPICard icon={FileText} label="GSTR-1" value={stats.gstr1Invoices || 0} />
        <KPICard icon={FileCheck} label="GST2A" value={stats.gst2aVendors || 0} />
        <KPICard icon={Landmark} label="Challans" value={stats.challans || 0} />
        <KPICard icon={ReceiptText} label="TDS" value={stats.tdsEntries || 0} />
        <KPICard icon={ScrollText} label="TCS" value={stats.tcsEntries || 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>GST Liability Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartMap['statutory-tax-trend'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={55} tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line dataKey="value" name="Tax Liability" stroke="#F97316" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>Compliance Docs</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
              <Pie data={chartMap['statutory-compliance'] || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                {(chartMap['statutory-compliance'] || []).map((entry, idx) => (
                  <Cell key={`${entry.name}-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value || 0)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>Input vs Output Ledger</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMap['statutory-ledger-mix'] || []} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 12, color: '#374151', fontSize: 14, fontWeight: 600 }}>Recent Statutory Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Reference</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Party</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 8).map((row, idx) => (
                  <tr key={`${row.type}-${row.id}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 8 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: '#FFEDD5', color: '#EA580C' }}>{row.type}</span>
                    </td>
                    <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{row.ref || '-'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: '#374151' }}>{row.party || '-'}</td>
                    <td style={{ padding: 8, fontSize: 12, color: '#6B7280' }}>{row.date || '-'}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600, fontSize: 12, color: '#F97316' }}>{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No statutory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}