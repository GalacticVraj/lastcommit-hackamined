import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RefreshCw, AlertCircle, AlertTriangle, Sparkles, TrendingUp, TrendingDown, Users, CheckCircle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import api from '../../lib/api';
import useUIStore from '../../lib/uiStore';

export default function AISummaryPanel() {
    const navigate = useNavigate();
    const { aiPanelOpen, setAiPanelOpen } = useUIStore();
    const [activeTab, setActiveTab] = useState('insights');
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);

    const [insightsData, setInsightsData] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [workforceData, setWorkforceData] = useState(null);

    // Fetch Insights
    const fetchInsights = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const endpoint = forceRefresh ? '/ai/refresh' : '/ai/insights';
            const method = forceRefresh ? 'post' : 'get';
            const res = await api[method](endpoint);
            if (res.data?.success) {
                setInsightsData(res.data.data);
                setLastRefresh(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('Failed to fetch insights');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Sales
    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ai/sales-projection');
            if (res.data?.success) setSalesData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch sales');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Workforce
    const fetchWorkforce = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ai/recruitment-projection');
            if (res.data?.success) setWorkforceData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch workforce');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aiPanelOpen) {
            if (activeTab === 'insights' && !insightsData) fetchInsights();
            if (activeTab === 'sales' && !salesData) fetchSales();
            if (activeTab === 'workforce' && !workforceData) fetchWorkforce();
        }
    }, [aiPanelOpen, activeTab]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleNavigate = (type) => {
        setAiPanelOpen(false);
        switch (type) {
            case 'invoice_overdue': navigate('/sales/invoices'); break;
            case 'sale_order_overdue': navigate('/sales/sale-orders'); break;
            case 'purchase_order_overdue': navigate('/purchase/purchase-orders'); break;
            case 'low_stock': navigate('/stores/warehouse'); break;
            case 'production_order_overdue': navigate('/production/orders'); break;
            default: break;
        }
    };

    const CustomChartTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#1C1A17',
                    border: '1px solid #E8720C',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#FAFAF8' }}>{label}</p>
                    {payload.map((entry, idx) => (
                        <p key={idx} style={{ margin: '2px 0 0 0', fontSize: '11px', color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '620px',
            maxWidth: '100vw',
            background: '#FAFAF8',
            zIndex: 10000,
            borderLeft: '3px solid #E8720C',
            boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.10)',
            transform: aiPanelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <header style={{
                background: '#F4F2EE',
                padding: '20px 24px',
                borderBottom: '1px solid #E2DDD6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#E8720C', margin: 0 }}>AI Insights</h2>
                    <p style={{ fontSize: '11px', color: '#9C9488', margin: '4px 0 0 0', letterSpacing: '0.05em' }}>REAL-TIME ERP INTELLIGENCE</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => fetchInsights(true)}
                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#9C9488' }}
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : 'hover:text-[#E8720C] transition-colors'} />
                    </button>
                    <button
                        onClick={() => setAiPanelOpen(false)}
                        style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#9C9488' }}
                    >
                        <X size={26} className="hover:text-[#1C1A17] transition-colors" strokeWidth={1.5} />
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <nav style={{
                background: '#F4F2EE',
                padding: '0 24px',
                borderBottom: '1px solid #E2DDD6',
                display: 'flex'
            }}>
                {[
                    { id: 'insights', label: 'Insights' },
                    { id: 'sales', label: 'Sales Outlook' },
                    { id: 'workforce', label: 'Workforce' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '14px 20px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: 'none',
                            border: 'none',
                            color: activeTab === tab.id ? '#E8720C' : '#9C9488',
                            borderBottom: `2px solid ${activeTab === tab.id ? '#E8720C' : 'transparent'}`,
                            cursor: 'pointer',
                            transition: '150ms'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Content area */}
            <div className="custom-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: '#FAFAF8'
            }}>
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton-card" />
                        ))}
                    </div>
                )}

                {/* INSIGHTS TAB */}
                {!loading && activeTab === 'insights' && insightsData && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {insightsData.alerts.critical.length > 0 && (
                            <>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#E8720C', letterSpacing: '0.1em', marginBottom: '8px', marginTop: '16px' }}>CRITICAL</div>
                                {insightsData.alerts.critical.map((alert, i) => (
                                    <div key={i} style={{
                                        background: '#EFEFEB', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2DDD6', borderLeft: '3px solid #C0392B', marginBottom: '8px'
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#3D3A35', fontWeight: 400, marginBottom: '8px' }}>{alert.message}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#9C9488' }}>Today</span>
                                            <button
                                                onClick={() => handleNavigate(alert.type)}
                                                style={{ background: 'none', border: 'none', color: '#E8720C', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                                                className="hover:underline"
                                            >
                                                GO TO
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {insightsData.alerts.warning.length > 0 && (
                            <>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', letterSpacing: '0.1em', marginBottom: '8px', marginTop: '16px' }}>WARNING</div>
                                {insightsData.alerts.warning.map((alert, i) => (
                                    <div key={i} style={{
                                        background: '#EFEFEB', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E2DDD6', borderLeft: '3px solid #D97706', marginBottom: '8px'
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#3D3A35', fontWeight: 400, marginBottom: '8px' }}>{alert.message}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#9C9488' }}>Today</span>
                                            <button
                                                onClick={() => handleNavigate(alert.type)}
                                                style={{ background: 'none', border: 'none', color: '#E8720C', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                                                className="hover:underline"
                                            >
                                                GO TO
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {insightsData.alerts.critical.length === 0 && insightsData.alerts.warning.length === 0 && (
                            <div style={{
                                background: '#F0F7F2', border: '1px solid #B8D4C0', borderLeft: '3px solid #4A7C59', padding: '14px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <CheckCircle size={20} color="#4A7C59" />
                                <span style={{ fontSize: '13px', color: '#4A7C59' }}>All systems normal</span>
                            </div>
                        )}

                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#C9860A', letterSpacing: '0.1em', marginBottom: '8px', marginTop: '24px' }}>AI ANALYSIS</div>
                        {insightsData.ai_insights.map((insight, i) => (
                            <div key={i} style={{
                                background: '#FEF0E6', padding: '14px 16px', borderRadius: '10px', border: '1px solid #F5C4A0', marginBottom: '8px', position: 'relative'
                            }}>
                                <span style={{ position: 'absolute', top: '14px', left: '16px', fontSize: '9px', color: '#C9860A', letterSpacing: '0.15em', fontWeight: 700 }}>AI INSIGHT</span>
                                <div style={{ fontSize: '13px', color: '#3D3A35', lineHeight: 1.6, marginTop: '12px' }}>{insight}</div>
                                <div style={{ fontSize: '9px', color: '#9C9488', marginTop: '8px', textAlign: 'right' }}>Powered by Claude</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SALES TAB */}
                {!loading && activeTab === 'sales' && salesData && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#EFEFEB', padding: '16px', borderRadius: '10px', border: '1px solid #E2DDD6' }}>
                                <div style={{ fontSize: '11px', color: '#9C9488', marginBottom: '4px', letterSpacing: '0.05em' }}>THIS MONTH REVENUE</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1C1A17' }}>{formatCurrency(salesData.monthly_actual[salesData.monthly_actual.length - 1]?.revenue || 0)}</div>
                            </div>
                            <div style={{ background: '#EFEFEB', padding: '16px', borderRadius: '10px', border: '1px solid #E2DDD6' }}>
                                <div style={{ fontSize: '11px', color: '#9C9488', marginBottom: '4px', letterSpacing: '0.05em' }}>AVG GROWTH RATE</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: '#E8720C' }}>{salesData.average_growth_rate}%</div>
                            </div>
                        </div>

                        <div style={{ height: '240px', width: '100%', marginBottom: '24px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[...salesData.monthly_actual, ...salesData.monthly_projected]}>
                                    <CartesianGrid stroke="#E2DDD6" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fill: '#9C9488', fontSize: 11 }} axisLine={{ stroke: '#E2DDD6' }} tickLine={false} />
                                    <YAxis tick={{ fill: '#9C9488', fontSize: 11 }} axisLine={{ stroke: '#E2DDD6' }} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                                    <RechartsTooltip content={<CustomChartTooltip />} />
                                    <Line type="monotone" name="Actual Revenue" dataKey="revenue" data={salesData.monthly_actual} stroke="#E8720C" strokeWidth={2} dot={{ fill: '#E8720C', r: 3 }} />
                                    <Line type="monotone" name="Projected Revenue" dataKey="revenue" data={salesData.monthly_projected} stroke="#C9860A" strokeWidth={2} strokeDasharray="6 4" dot={{ fill: '#C9860A', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#F4F2EE', borderBottom: '1px solid #E2DDD6' }}>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#9C9488', fontWeight: 700, fontSize: '11px' }}>PRODUCT</th>
                                        <th style={{ textAlign: 'right', padding: '12px', color: '#9C9488', fontWeight: 700, fontSize: '11px' }}>REVENUE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesData.top_products.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #E2DDD6' }} className="hover:bg-[#F4F2EE] transition-colors">
                                            <td style={{ padding: '12px', color: '#3D3A35' }}>{p.item_name}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#E8720C' }}>{formatCurrency(p.revenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* WORKFORCE TAB */}
                {!loading && activeTab === 'workforce' && workforceData && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#EFEFEB', padding: '16px', borderRadius: '10px', border: '1px solid #E2DDD6' }}>
                                <div style={{ fontSize: '11px', color: '#9C9488', marginBottom: '4px', letterSpacing: '0.05em' }}>CURRENT TEAM</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1C1A17' }}>{workforceData.current_headcount}</div>
                            </div>
                            <div style={{ background: '#EFEFEB', padding: '16px', borderRadius: '10px', border: '1px solid #E2DDD6' }}>
                                <div style={{ fontSize: '11px', color: '#9C9488', marginBottom: '4px', letterSpacing: '0.05em' }}>CAPACITY GAP</div>
                                <div style={{ fontSize: '22px', fontWeight: 700, color: '#E8720C' }}>{Math.max(...workforceData.monthly_requirements.map(d => d.gap))}</div>
                            </div>
                        </div>

                        <div style={{ height: '200px', width: '100%', marginBottom: '24px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={workforceData.monthly_requirements}>
                                    <CartesianGrid stroke="#E2DDD6" strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fill: '#9C9488', fontSize: 11 }} axisLine={{ stroke: '#E2DDD6' }} tickLine={false} />
                                    <YAxis tick={{ fill: '#9C9488', fontSize: 11 }} axisLine={{ stroke: '#E2DDD6' }} tickLine={false} />
                                    <RechartsTooltip content={<CustomChartTooltip />} />
                                    <Bar dataKey="workers_needed" name="Required" fill="#E8720C" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="current_capacity" name="Current" fill="#F5924A" radius={[4, 4, 0, 0]} barSize={30} />


                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {Math.max(...workforceData.monthly_requirements.map(d => d.gap)) > 0 ? (
                            <div style={{
                                background: '#FDF6E3', padding: '16px', borderRadius: '10px', border: '1px solid #F5C4A0', borderLeft: '3px solid #C9860A', display: 'flex', gap: '12px', alignItems: 'flex-start'
                            }}>
                                <Users size={20} color="#C9860A" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#1C1A17' }}>Recommendation</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#3D3A35', lineHeight: 1.6 }}>
                                        {workforceData.recommendation}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                background: '#F0F7F2', padding: '16px', borderRadius: '10px', border: '1px solid #B8D4C0', borderLeft: '3px solid #4A7C59', display: 'flex', gap: '12px', alignItems: 'flex-start'
                            }}>
                                <CheckCircle size={20} color="#4A7C59" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#1C1A17' }}>Staffing Optimization</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#4A7C59', lineHeight: 1.6 }}>
                                        Current headcount aligns with project requirements across all periods. No additional recruitment is projected at this time.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>


            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2DDD6; border-radius: 2px; }
                .skeleton-card {
                    height: 80px;
                    background: #F4F2EE;
                    border-radius: 10px;
                    animation: skeletonPulse 1.5s infinite linear;
                }
                @keyframes skeletonPulse {
                    0% { background-color: #F4F2EE; }
                    50% { background-color: #EFEFEB; }
                    100% { background-color: #F4F2EE; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
