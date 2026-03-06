import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, Briefcase, Calendar, Wallet, Mail, Building, CreditCard, User } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import PermissionGate from '../components/PermissionGate';
import DataTable from '../components/DataTable';

export default function EmployeeProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/hr/employees/${id}`);
                setProfile(res.data.data);
            } catch (e) {
                toast.error('Failed to load employee profile');
                navigate('/hr');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, navigate]);

    if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 200, marginBottom: 20 }} /><div className="skeleton" style={{ height: 400 }} /></div>;
    if (!profile) return null;

    // Use salary structure if available, otherwise fall back to employee's direct salary fields
    const currentStructure = profile.salaryStructures?.[0] || {};
    const basic = currentStructure.basic || profile.basicSalary || 0;
    const hra = currentStructure.hra || profile.hra || 0;
    const da = currentStructure.da || profile.da || 0;
    const allowances = currentStructure.allowances || profile.otherAllowances || 0;
    const pfPercent = currentStructure.pfPercent || (profile.pfApplicable ? 12 : 0);
    
    const gross = Number(basic) + Number(hra) + Number(da) + Number(allowances);
    const pfAmount = gross * (pfPercent / 100);
    const lastNetPay = profile.salarySheets?.[0]?.netPay || 0;
    const netPay = lastNetPay || (gross - pfAmount);

    const advanceCols = [
        { key: 'amount', label: 'Amount', render: r => `₹${Number(r.amount).toLocaleString()}` },
        { key: 'advanceDate', label: 'Date', render: r => r.advanceDate ? new Date(r.advanceDate).toLocaleDateString() : '—' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${(r.status || '').toLowerCase().replace(' ', '-')}`}>{r.status}</span> }
    ];

    const salaryCols = [
        { key: 'month', label: 'Month', render: r => `${r.month} ${r.year}` },
        { key: 'totalDays', label: 'Days (P/T)', render: r => `${r.presentDays || 0}/${r.totalDays || 0}` },
        { key: 'grossSalary', label: 'Gross', render: r => `₹${Number(r.grossSalary || 0).toLocaleString()}` },
        { key: 'netPay', label: 'Net Pay', render: r => `₹${Number(r.netPay || 0).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${(r.status || 'draft').toLowerCase()}`}>{r.status || 'Draft'}</span> }
    ];

    return (
        <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Employee Profile</h1>
                <div style={{ marginLeft: 'auto' }}>
                    <PermissionGate permission="hr.employee.edit">
                        <button className="btn btn-primary btn-sm"><Edit size={16} /> Edit</button>
                    </PermissionGate>
                </div>
            </div>

            {/* Top Row - Profile Card + Salary Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 2fr)', gap: 20, marginBottom: 20 }}>
                {/* Profile Card */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 24, fontWeight: 'bold', flexShrink: 0 }}>
                            {profile.name?.charAt(0) || 'E'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={12} /> {profile.designation || '—'}</p>
                            <span className={`badge badge-${profile.isActive ? 'active' : 'closed'}`} style={{ fontSize: 10, padding: '2px 8px' }}>{profile.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Emp Code</div><div style={{ fontSize: 13, fontWeight: 500 }}>{profile.empCode || '—'}</div></div>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Department</div><div style={{ fontSize: 13 }}>{profile.department || '—'}</div></div>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} /> Mobile</div><div style={{ fontSize: 13 }}>{profile.mobile || '—'}</div></div>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={10} /> Email</div><div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email || '—'}</div></div>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> Joined</div><div style={{ fontSize: 13 }}>{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'}</div></div>
                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}><CreditCard size={10} /> PAN</div><div style={{ fontSize: 13 }}>{profile.panNumber || '—'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Building size={10} /> Bank Account</div><div style={{ fontSize: 12 }}>{profile.bankAccount || '—'} {profile.bankIfsc ? `(${profile.bankIfsc})` : ''}</div></div>
                    </div>
                </div>

                {/* Salary Structure */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={16} /> Salary Structure</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 16px' }}>
                        <div style={{ background: 'var(--bg-hover)', padding: '10px 12px', borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Basic</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>₹{Number(basic).toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'var(--bg-hover)', padding: '10px 12px', borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HRA</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>₹{Number(hra).toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'var(--bg-hover)', padding: '10px 12px', borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DA + Allow.</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>₹{(Number(da) + Number(allowances)).toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'var(--bg-hover)', padding: '10px 12px', borderRadius: 6, gridColumn: 'span 2' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Pay</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>₹{gross.toLocaleString()}</div>
                        </div>
                        <div style={{ background: 'var(--bg-hover)', padding: '10px 12px', borderRadius: 6 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PF ({pfPercent}%)</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#DC2626' }}>-₹{Math.round(pfAmount).toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: 6, gridColumn: '1 / -1', border: '1px solid #86efac' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Pay (Latest)</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>₹{Number(netPay || 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row - Attendance + Salary History */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', gap: 20, marginBottom: 20 }}>
                {/* Attendance Summary */}
                <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Attendance (This Month)</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{profile.attendanceSummary?.presentDays || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#DC2626' }}>{profile.attendanceSummary?.absentDays || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#D97706' }}>{profile.attendanceSummary?.leaves || 0}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leaves</div>
                        </div>
                    </div>
                </div>

                {/* Salary History */}
                <div className="card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Salary History (Last 6 Months)</h3>
                    <DataTable data={profile.salarySheets || []} columns={salaryCols} perPage={6} emptyMessage="No salary records" />
                </div>
            </div>

            {/* Bottom Row - Advances */}
            <div className="card" style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Advance Records</h3>
                <DataTable data={profile.advanceMemos || []} columns={advanceCols} perPage={5} emptyMessage="No advance records" />
            </div>
        </div>
    );
}
