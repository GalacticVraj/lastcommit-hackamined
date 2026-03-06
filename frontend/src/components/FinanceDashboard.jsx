import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, CreditCard, Receipt, FileText, Building2, Wallet, RefreshCw } from 'lucide-react';
import api from '../lib/api';

// Orange & Gray theme colors
const ORANGE_ACCENT = '#F97316';
const ORANGE_SHADES = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'];
const GRAY_SHADES = ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'];
const CHART_COLORS = ['#F97316', '#6B7280', '#FB923C', '#9CA3AF', '#FDBA74'];
const PAYMENT_MODE_COLORS = {
  'Cash': '#F97316',
  'Bank': '#6B7280',
  'UPI': '#FB923C',
  'Cheque': '#9CA3AF',
  'Online': '#FDBA74',
  'Card': '#374151'
};

// Format to Indian Lakh notation
const formatLakh = (value) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

// Animated counter hook
const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      countRef.current = Math.floor(eased * end);
      setCount(countRef.current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

// KPI Card with clean icon styling matching dashboard theme
const KPICard = ({ icon: Icon, label, value, isCurrency = false, color = ORANGE_ACCENT }) => {
  const animatedValue = useCountUp(value, 800);
  
  return (
    <div className="stat-card" style={{ flex: '1 1 auto', minWidth: '110px', padding: '14px 12px' }}>
      <div className="stat-icon" style={{ 
        background: 'var(--glass-bg)', 
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        width: '40px', 
        height: '40px', 
        flexShrink: 0,
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

// Custom tooltip with orange accent
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
            {entry.name}: {formatLakh(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load finance dashboard:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <RefreshCw size={32} className="spin" style={{ color: ORANGE_ACCENT }} />
      </div>
    );
  }

  if (!data) return <div>Failed to load dashboard data</div>;

  const { stats, charts, recentTransactions } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPI Cards Row - fits in single line without horizontal scroll */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        flexWrap: 'nowrap',
        width: '100%'
      }}>
        <KPICard icon={FileText} label="Journal" value={stats.totalJournalVouchers} color="#F97316" />
        <KPICard icon={Receipt} label="Pay/Rcpt" value={stats.totalPaymentReceipts} color="#6B7280" />
        <KPICard icon={Wallet} label="Contra" value={stats.totalContraVouchers} color="#FB923C" />
        <KPICard icon={Building2} label="GST" value={stats.totalGSTVouchers} color="#374151" />
        <KPICard icon={TrendingUp} label="Journal Amt" value={stats.totalJournalAmount} isCurrency color="#F97316" />
        <KPICard icon={CreditCard} label="Payments" value={stats.totalPaymentAmount} isCurrency color="#6B7280" />
        <KPICard icon={Receipt} label="Receipts" value={stats.totalReceiptAmount} isCurrency color="#FB923C" />
        <KPICard icon={CreditCard} label="CC Spend" value={stats.totalCreditCardSpend} isCurrency color="#374151" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Monthly Transaction Trends */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Monthly Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.monthlyTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="journal" name="Journal" fill="#F97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="payment" name="Payment" fill="#374151" radius={[3, 3, 0, 0]} />
              <Bar dataKey="receipt" name="Receipt" fill="#FB923C" radius={[3, 3, 0, 0]} />
              <Bar dataKey="contra" name="Contra" fill="#6B7280" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gst" name="GST" fill="#9CA3AF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Modes Donut */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Payment Modes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart margin={{ top: 10, right: 80, left: 80, bottom: 10 }}>
              <Pie
                data={charts.paymentModes}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 25;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              >
                {charts.paymentModes.map((entry, idx) => (
                  <Cell key={idx} fill={PAYMENT_MODE_COLORS[entry.name] || CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatLakh(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* GST Input vs Output */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>GST Input vs Output</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.gstBreakdown} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} axisLine={false} />
              <Tooltip formatter={(value) => formatLakh(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <Cell fill="#F97316" />
                <Cell fill="#6B7280" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '2px', background: '#F97316' }}></span>
              Input
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '2px', background: '#6B7280' }}></span>
              Output
            </span>
          </div>
        </div>

        {/* Bank Reconciliation Status */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Bank Reconciliation</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={charts.bankReconciliationStatus}
                cx="50%"
                cy="45%"
                outerRadius={50}
                dataKey="count"
                nameKey="name"
                label={({ cx, cy, midAngle, outerRadius, count }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 15;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return <text x={x} y={y} fill="#374151" textAnchor="middle" fontSize={12} fontWeight={600}>{count}</text>;
                }}
                labelLine={false}
              >
                <Cell fill="#F97316" />
                <Cell fill="#9CA3AF" />
              </Pie>
              <Tooltip formatter={(value, name, props) => [
                `${value} records (${formatLakh(props.payload.amount)})`,
                props.payload.name
              ]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316' }}></span>
              Reconciled
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9CA3AF' }}></span>
              Pending
            </span>
          </div>
        </div>

        {/* Credit Card by Expense Head */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>CC by Expense</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={charts.creditCardByExpenseHead?.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tickFormatter={formatLakh} tick={{ fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatLakh(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {charts.creditCardByExpenseHead?.slice(0, 5).map((entry, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ marginBottom: '12px', color: '#374151', fontSize: '14px', fontWeight: 600 }}>Recent Transactions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Voucher No</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions?.slice(0, 6).map((txn, idx) => (
                <tr key={`${txn.type}-${txn.id}-${idx}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: txn.type === 'Receipt' ? '#FED7AA' : 
                                  txn.type === 'Payment' ? '#E5E7EB' : 
                                  txn.type === 'Journal' ? '#FFEDD5' :
                                  txn.type === 'Contra' ? '#D1D5DB' : '#FEF3C7',
                      color: txn.type === 'Receipt' ? '#C2410C' : 
                             txn.type === 'Payment' ? '#374151' : 
                             txn.type === 'Journal' ? '#EA580C' :
                             txn.type === 'Contra' ? '#4B5563' : '#92400E'
                    }}>
                      {txn.type}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{txn.voucherNo}</td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280' }}>{new Date(txn.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, fontSize: '12px', color: '#F97316' }}>
                    {formatLakh(txn.amount)}
                  </td>
                  <td style={{ padding: '8px', fontSize: '12px', color: '#6B7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
