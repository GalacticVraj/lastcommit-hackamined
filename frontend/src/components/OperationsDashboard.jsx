import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import api from '../lib/api';

const COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#374151', '#FDBA74'];

const formatLabel = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase());

const formatNumber = (value) => {
  if (typeof value !== 'number') return value;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString('en-IN');
};

function ChartCard({ title, children, height = 280 }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

function renderChartNode(chart) {
  const chartType = chart?.type || 'bar';
  const chartData = chart?.data || [];

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={85}>
            {chartData.map((entry, idx) => <Cell key={`${entry.name}-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip formatter={(v) => formatNumber(Number(v || 0))} />
          <Line dataKey="value" stroke="#6B7280" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'bar-horizontal') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={120} />
          <Tooltip />
          <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatNumber} allowDecimals={false} />
        <Tooltip formatter={(v) => formatNumber(Number(v || 0))} />
        <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function OperationsDashboard({ apiBase, title, stats: initialStats }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(initialStats || null);
  const [charts, setCharts] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const dashboardRes = await api.get(`${apiBase}/dashboard`);

        if (!mounted) return;

        const payload = dashboardRes?.data?.data || {};
        setStats(payload.stats || initialStats || {});
        setCharts(Array.isArray(payload.charts) ? payload.charts : []);
        setRecent(Array.isArray(payload.recent) ? payload.recent : []);
      } catch (error) {
        console.error('Failed to load operations dashboard', error);
      }
      if (mounted) setLoading(false);
    };

    fetchAll();
    return () => { mounted = false; };
  }, [apiBase, initialStats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px' }}>
        <RefreshCw size={30} className="animate-spin" style={{ color: '#F97316' }} />
      </div>
    );
  }

  if (!stats) {
    return <div style={{ color: 'var(--text-muted)' }}>Unable to load dashboard.</div>;
  }

  const statEntries = Object.entries(stats);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ padding: '12px 16px' }}>
        <div className="card-title" style={{ marginBottom: 8 }}>{title} Insights</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Live visualization across all submodules with synchronized records.
        </div>
      </div>

      <div className="stats-grid">
        {statEntries.map(([key, value]) => (
          <div className="stat-card" key={key}>
            <div>
              <div className="stat-value">{typeof value === 'number' ? formatNumber(value) : value}</div>
              <div className="stat-label">{formatLabel(key)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {charts.map((chart) => (
          <ChartCard key={chart.key} title={chart.title} height={280}>
            {renderChartNode(chart)}
          </ChartCard>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="card-header" style={{ padding: 0, marginBottom: 10 }}>
          <span className="card-title">Recent Activity</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px' }}>Reference</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={`${row.type}-${row.id}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{row.type}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{row.ref || '—'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{row.status || '—'}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>{formatNumber(Number(row.amount || 0))}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <Legend payload={COLORS.map((color, idx) => ({ id: idx, type: 'square', value: `Series ${idx + 1}`, color }))} />
        </div>
      </div>
    </div>
  );
}
