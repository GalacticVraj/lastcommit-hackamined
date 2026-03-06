import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, UserCheck, Wallet, Clock, TrendingUp, BadgeIndianRupee, RefreshCw } from 'lucide-react';
import api from '../lib/api';

// Theme colors - Orange & Gray palette matching main dashboard
const ORANGE = '#F97316';
const ORANGE_LIGHT = '#FB923C';
const GRAY_DARK = '#374151';
const GRAY_MID = '#6B7280';

// Chart color palette alternating orange/gray
const CHART_PALETTE = [ORANGE, GRAY_DARK, ORANGE_LIGHT, GRAY_MID];

// Format to Indian Lakh notation
const formatLakh = (value) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value?.toFixed(0) || 0}`;
};

// Animated counter hook
const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (end === 0 || end === undefined || end === null) { setCount(0); return; }
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    startTimeRef.current = null;
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
};

// KPI Card matching main dashboard stat-card style with soft rounded icon
const KPICard = ({ icon: Icon, label, value, isCurrency = false }) => {
  const animatedValue = useCountUp(value, 800);
  
  return (
    <div className="stat-card">
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'rgba(107, 114, 128, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={22} strokeWidth={1.5} style={{ color: '#6B7280' }} />
      </div>
      <div>
        <div className="stat-value">
          {isCurrency ? formatLakh(animatedValue) : animatedValue.toLocaleString()}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
};

// Custom Tooltip with orange border
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff',
        border: `2px solid ${ORANGE}`,
        borderRadius: '8px',
        padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(249,115,22,0.2)'
      }}>
        <p style={{ fontWeight: 700, marginBottom: '6px', color: GRAY_DARK, fontSize: '13px' }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, margin: '4px 0', fontSize: '12px', fontWeight: 500 }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 ? formatLakh(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart container using standard card class
const ChartCard = ({ title, children, height = 300 }) => (
  <div className="card">
    <div className="card-header">
      <span className="card-title">{title}</span>
    </div>
    <div style={{ height }}>
      {children}
    </div>
  </div>
);

export default function HRDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading || !data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <RefreshCw className="animate-spin" size={36} style={{ color: ORANGE }} />
        <span style={{ color: GRAY_MID, fontSize: '14px' }}>Loading HR Dashboard...</span>
      </div>
    );
  }

  const { stats, charts } = data;

  return (
    <div style={{ padding: '4px 0' }}>
      {/* KPI Cards Row - matching main dashboard stats-grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <KPICard icon={Users} label="Total Employees" value={stats.totalEmployees} />
        <KPICard icon={UserCheck} label="Active Employees" value={stats.activeEmployees} />
        <KPICard icon={BadgeIndianRupee} label="Salary Heads" value={stats.totalSalaryHeads} />
        <KPICard icon={Clock} label="Pending Advances" value={stats.pendingAdvances} />
        <KPICard icon={Wallet} label="Advance Amount" value={stats.totalAdvanceAmount} isCurrency />
        <KPICard icon={TrendingUp} label="Total Net Pay" value={stats.totalNetPay} isCurrency />
      </div>

      {/* Charts Grid */}
      {/* Charts Grid - matching main dashboard */}
      <div className="charts-grid" style={{ marginBottom: '16px' }}>
        
        {/* Department Headcount */}
        <ChartCard title="Department-wise Headcount" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.departmentHeadcount} margin={{ top: 20, right: 20, left: 10, bottom: 60 }} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: GRAY_MID, fontWeight: 500, dy: 5 }} 
                angle={-35} 
                textAnchor="end" 
                tickLine={false} 
                axisLine={{ stroke: '#D1D5DB' }} 
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: GRAY_MID, fontWeight: 500 }} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Employees" maxBarSize={50}>
                {charts.departmentHeadcount.map((_, idx) => (
                  <Cell key={idx} fill={idx % 2 === 0 ? ORANGE : GRAY_DARK} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Salary Trend */}
        <ChartCard title="Monthly Salary Trend" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.monthlyNetPay} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: GRAY_MID, fontWeight: 500 }} tickLine={false} axisLine={{ stroke: '#D1D5DB' }} />
              <YAxis tick={{ fontSize: 11, fill: GRAY_MID, fontWeight: 500 }} tickFormatter={formatLakh} width={60} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: ORANGE, strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '15px' }} />
              <Line type="monotone" dataKey="grossPay" stroke={ORANGE} strokeWidth={3} dot={{ fill: ORANGE, r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 2 }} name="Gross Pay" />
              <Line type="monotone" dataKey="netPay" stroke={GRAY_DARK} strokeWidth={3} dot={{ fill: GRAY_DARK, r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 2 }} name="Net Pay" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie Charts Row */}
      <div className="charts-grid" style={{ marginBottom: '16px' }}>
        
        {/* Earnings vs Deductions */}
        <ChartCard title="Earnings vs Deductions" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 40, right: 100, left: 100, bottom: 40 }}>
              <Pie
                data={charts.earningDeductionSplit}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="#1F2937"
                strokeWidth={1}
                label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#1F2937" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={500}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={{ stroke: '#374151', strokeWidth: 1 }}
              >
                <Cell fill={ORANGE} />
                <Cell fill={GRAY_DARK} />
              </Pie>
              <Tooltip formatter={(value) => formatLakh(value)} contentStyle={{ background: '#fff', border: '1px solid #D1D5DB', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Advance Recovery */}
        <ChartCard title="Advance Recovery Status" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 40, right: 100, left: 100, bottom: 40 }}>
              <Pie
                data={charts.advanceRecovery}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="#1F2937"
                strokeWidth={1}
                label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#1F2937" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={500}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={{ stroke: '#374151', strokeWidth: 1 }}
              >
                <Cell fill={ORANGE} />
                <Cell fill={GRAY_MID} />
              </Pie>
              <Tooltip formatter={(value) => formatLakh(value)} contentStyle={{ background: '#fff', border: '1px solid #D1D5DB', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Middle Charts - Salary Structure Coverage + Designation Headcount */}
      <div className="charts-grid" style={{ marginBottom: '16px' }}>
        
        {/* Structure Coverage */}
        <ChartCard title="Salary Structure Coverage" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 30, right: 100, left: 100, bottom: 30 }}>
              <Pie
                data={charts.structureCoverage}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="#1F2937"
                strokeWidth={1}
                label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#1F2937" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={500}>
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={{ stroke: '#374151', strokeWidth: 1 }}
              >
                <Cell fill={ORANGE_LIGHT} />
                <Cell fill={GRAY_DARK} />
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #D1D5DB', borderRadius: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Designation Headcount */}
        <ChartCard title="Designation-wise Headcount" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.designationHeadcount} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: GRAY_MID, fontWeight: 500 }} allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: GRAY_MID, fontWeight: 500 }} width={120} tickLine={false} axisLine={{ stroke: '#D1D5DB' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Employees" barSize={25}>
                {charts.designationHeadcount.map((_, idx) => (
                  <Cell key={idx} fill={idx % 2 === 0 ? GRAY_DARK : ORANGE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Charts - Advances by Status + Salary Heads */}
      <div className="charts-grid">
        
        {/* Advances by Status */}
        <ChartCard title="Advances by Status" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={charts.advanceStatus?.map(item => ({
                ...item,
                shortName: item.name === 'Partially Recovered' ? 'Partial' : 
                           item.name === 'Fully Recovered' ? 'Recovered' : item.name
              }))} 
              margin={{ top: 20, right: 15, left: 5, bottom: 50 }} 
              barCategoryGap="8%"
            >
              <CartesianGrid strokeDasharray="0" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="shortName" 
                tick={{ fontSize: 9, fill: GRAY_MID, fontWeight: 500 }} 
                angle={-30} 
                textAnchor="end" 
                tickLine={false} 
                axisLine={{ stroke: '#D1D5DB' }}
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: GRAY_MID, fontWeight: 500 }} tickFormatter={formatLakh} width={50} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} name="Amount (₹)" maxBarSize={45}>
                {charts.advanceStatus?.map((_, idx) => (
                  <Cell key={idx} fill={idx % 2 === 0 ? ORANGE : GRAY_DARK} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Salary Heads Config */}
        {charts.salaryHeadsByType && charts.salaryHeadsByType.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">Salary Heads Configuration</span></div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', padding: '40px 20px' }}>
              {charts.salaryHeadsByType.map((head, idx) => (
                <div key={head.name} className="stat-card" style={{ minWidth: '140px', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stat-value" style={{ color: idx === 0 ? ORANGE : GRAY_DARK }}>
                      {head.count}
                    </div>
                    <div className="stat-label">{head.name} Heads</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

