import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RefreshCw, ClipboardCheck, FlaskConical, Shield, PackageSearch, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

const ORANGE_ACCENT = '#F97316';
const CHART_COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74', '#374151'];

const formatLakh = (value) => {
  if (typeof value !== 'number') return value ?? 0;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
};

const useCountUp = (end, duration = 900) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const target = Number(end || 0);
    if (target === 0) { setCount(0); return; }
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

const KPICard = ({ icon: Icon, label, value, isCurrency = false }) => {
  const animatedValue = useCountUp(value, 800);
  return (
    <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
      <div className="stat-icon" style={{
        background: 'var(--glass-bg)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px',
        width: '40px', height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={20} color="#6B7280" strokeWidth={1.5} />
      </div>
      <div style={{ flexShrink: 0 }}>
        <div style={{ color: '#000', fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {isCurrency ? formatLakh(animatedValue) : animatedValue}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.98)', border: '1px solid #F97316',
        borderRadius: '6px', padding: '10px 12px',
        boxShadow: '0 4px 12px rgba(249,115,22,0.15)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '6px', color: '#374151', fontSize: '12px' }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, margin: '3px 0', fontSize: '11px' }}>
            {entry.name}: {Number(entry.value || 0).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function QualityDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/quality/dashboard');
        if (!mounted) return;
        const payload = res?.data?.data || {};
        setStats(payload.stats || {});
        setCharts(Array.isArray(payload.charts) ? payload.charts : []);
        setRecent(Array.isArray(payload.recent) ? payload.recent : []);
      } catch (err) {
        console.error('Failed to load quality dashboard', err);
      }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
        <RefreshCw size={30} className="animate-spin" style={{ color: ORANGE_ACCENT }} />
      </div>
    );
  }

  if (!stats) return <div style={{ color: 'var(--text-muted)' }}>Unable to load quality dashboard.</div>;

  const chartMap = (charts || []).reduce((acc, c) => { acc[c.key] = c.data || []; return acc; }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', width: '100%' }}>
        <KPICard icon={ClipboardCheck} label="IQC Records"  value={stats.totalIqc || 0} />
        <KPICard icon={FlaskConical}   label="MTS Checks"   value={stats.totalMts || 0} />
        <KPICard icon={Shield}         label="PQC Entries"   value={stats.totalPqc || 0} />
        <KPICard icon={PackageSearch}  label="PDI Reports"   value={stats.totalPdi || 0} />
        <KPICard icon={AlertTriangle}  label="QRD Rejections" value={stats.totalQrd || 0} />
      </div>

      {/* Row 1: Pie (Inspection Status) + Bar (IQC Monthly Trend) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Inspection Status Mix</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
              <Pie
                data={chartMap['quality-status'] || []}
                dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                innerRadius={35} outerRadius={55}
              >
                {(chartMap['quality-status'] || []).map((entry, idx) => (
                  <Cell key={`${entry.name}-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => Number(v || 0)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>IQC Trend by Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartMap['quality-monthly'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="value" name="Inspections" stroke="#F97316" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: QRD Action Split bar + Recent activity table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Rejection Action Split</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMap['quality-qrd'] || []} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                {(chartMap['quality-qrd'] || []).map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Recent Quality Activity</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Reference</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Sample Qty</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 7).map((row, idx) => (
                  <tr key={`${row.id}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: row.type === 'IQC' ? '#FFEDD5' : row.type === 'PQC' ? '#DBEAFE' : '#E5E7EB',
                        color: row.type === 'IQC' ? '#EA580C' : row.type === 'PQC' ? '#2563EB' : '#374151',
                      }}>{row.type}</span>
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{row.ref || '-'}</td>
                    <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280' }}>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '-'}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                        background: row.status === 'Pass' ? '#DCFCE7' : row.status === 'Fail' ? '#FEE2E2' : '#F3F4F6',
                        color: row.status === 'Pass' ? '#16A34A' : row.status === 'Fail' ? '#DC2626' : '#374151',
                      }}>{row.status || '-'}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: '#F97316' }}>{Number(row.amount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>No recent records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
