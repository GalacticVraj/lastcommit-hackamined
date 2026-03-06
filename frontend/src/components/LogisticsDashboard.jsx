import { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { RefreshCw, Truck, Route, PackageCheck, IndianRupee, ShieldCheck, Clock } from 'lucide-react';
import api from '../lib/api';

const ORANGE_ACCENT = '#F97316';
const CHART_COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74'];

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

const KPICard = ({ icon: Icon, label, value, isCurrency = false }) => {
  const animatedValue = useCountUp(value, 800);

  return (
    <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
      <div className="stat-icon" style={{
        background: 'var(--glass-bg)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} color="#6B7280" strokeWidth={1.5} />
      </div>
      <div style={{ flexShrink: 0 }}>
        <div style={{ color: '#000000', fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid #F97316',
        borderRadius: '6px',
        padding: '10px 12px',
        boxShadow: '0 4px 12px rgba(249,115,22,0.15)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '6px', color: '#374151', fontSize: '12px' }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, margin: '3px 0', fontSize: '11px' }}>
            {entry.name}: {formatLakh(Number(entry.value || 0))}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LogisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/logistics/dashboard');
        if (!mounted) return;
        const payload = res?.data?.data || {};
        setStats(payload.stats || {});
        setCharts(Array.isArray(payload.charts) ? payload.charts : []);
        setRecent(Array.isArray(payload.recent) ? payload.recent : []);
        setDestinations(Array.isArray(payload.highlights?.destinations) ? payload.highlights.destinations : []);
      } catch (error) {
        console.error('Failed to load logistics dashboard', error);
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

  if (!stats) {
    return <div style={{ color: 'var(--text-muted)' }}>Unable to load logistics dashboard.</div>;
  }

  const chartMap = (charts || []).reduce((acc, chart) => {
    acc[chart.key] = chart.data || [];
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'nowrap',
        width: '100%'
      }}>
        <KPICard icon={Truck} label="Transporters" value={stats.totalTransporters || 0} />
        <KPICard icon={ShieldCheck} label="Active" value={stats.activeTransporters || 0} />
        <KPICard icon={Route} label="Dispatches" value={stats.totalDispatches || 0} />
        <KPICard icon={Clock} label="In Transit" value={stats.inTransitDispatches || 0} />
        <KPICard icon={PackageCheck} label="Delivered" value={stats.deliveredDispatches || 0} />
        <KPICard icon={IndianRupee} label="Monthly Freight" value={stats.monthlyFreight || 0} isCurrency />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Monthly Freight Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartMap['logistics-monthly-freight'] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="value" name="Freight" stroke="#F97316" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Dispatch Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
              <Pie data={chartMap['logistics-status'] || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                {(chartMap['logistics-status'] || []).map((entry, idx) => (
                  <Cell key={`${entry.name}-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value || 0)} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Top Transporters</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartMap['logistics-transporter'] || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => Number(value || 0)} />
              <Bar dataKey="value" fill="#6B7280" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Top Destinations</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {destinations.map((row, idx) => (
              <div key={`${row.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#374151' }}>{row.name}</span>
                <strong style={{ fontSize: 12, color: '#F97316' }}>{row.value}</strong>
              </div>
            ))}
            {destinations.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No destination data available.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Recent Dispatches</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Ref</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Transporter</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Destination</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Freight</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 6).map((row, idx) => (
                <tr key={`${row.id}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{row.ref || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#374151' }}>{row.transporter || '-'}</td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280' }}>{row.destination || '-'}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: row.status === 'Delivered' ? '#FED7AA' : row.status === 'In Transit' ? '#E5E7EB' : '#FFEDD5',
                      color: row.status === 'Delivered' ? '#C2410C' : row.status === 'In Transit' ? '#374151' : '#EA580C'
                    }}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: '#F97316' }}>{formatLakh(Number(row.amount || 0))}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent dispatches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
