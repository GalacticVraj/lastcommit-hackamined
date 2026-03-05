import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Phone, Briefcase, FileText, Calendar, Wallet } from 'lucide-react';
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
        fetchProfile(); // the existing /hr/employees/:id endpoint already has what we need
    }, [id, navigate]);

    if (loading) return <div className="page-content"><div className="skeleton" style={{ height: 200, marginBottom: 20 }} /><div className="skeleton" style={{ height: 400 }} /></div>;
    if (!profile) return null;

    const currentStructure = profile.salaryStructures?.[0] || {};
    const gross = (currentStructure.basic || 0) + (currentStructure.hra || 0) + (currentStructure.da || 0) + (currentStructure.allowances || 0);
    const pfAmount = gross * ((currentStructure.pfPercent || 0) / 100);
    // prefer latest salary sheet net pay if available
    const lastNetPay = profile.salarySheets?.[0]?.netPay || 0;
    const netPay = lastNetPay || (gross - pfAmount - ((currentStructure.esiPercent || 0) / 100 * gross));

    const memoCols = [
        { key: 'amount', label: 'Amount', render: r => `₹${Number(r.amount).toLocaleString()}` },
        { key: 'givenDate', label: 'Date Given', render: r => new Date(r.givenDate).toLocaleDateString() },
        { key: 'remarks', label: 'Remarks' },
        { key: 'isRecovered', label: 'Status', render: r => <span className={`badge badge-${r.isRecovered ? 'passed' : 'pending'}`}>{r.isRecovered ? 'Recovered' : 'Pending'}</span> }
    ];

    const salaryCols = [
        { key: 'month', label: 'Month', render: r => `${r.month}/${r.year}` },
        { key: 'totalDays', label: 'Days (P/T)', render: r => `${r.presentDays}/${r.totalDays}` },
        { key: 'grossSalary', label: 'Gross', render: r => `₹${Number(r.grossSalary).toLocaleString()}` },
        { key: 'netPay', label: 'Net Pay', render: r => `₹${Number(r.netPay).toLocaleString()}` },
        { key: 'status', label: 'Status', render: r => <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span> }
    ];

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Employee Profile</h1>
                <div style={{ marginLeft: 'auto' }}>
                    <PermissionGate permission="hr.employee.edit">
                        <button className="btn btn-primary btn-sm"><Edit size={16} /> Edit Profile</button>
                    </PermissionGate>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 32, fontWeight: 'bold' }}>
                            {profile.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{profile.name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={14} /> {profile.designation || '—'}</p>
                            <span className={`badge badge-${profile.isActive ? 'active' : 'closed'}`}>{profile.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emp Code</div><div style={{ fontSize: 14, fontWeight: 500 }}>{profile.empCode}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div><div style={{ fontSize: 14 }}>{profile.department || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> Mobile</div><div style={{ fontSize: 14 }}>{profile.mobile || '—'}</div></div>
                        <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> Joined On</div><div style={{ fontSize: 14 }}>{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '—'}</div></div>
                        <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Acc</div><div style={{ fontSize: 14 }}>{profile.bankAccount || '—'} (IFSC: {profile.bankIfsc || '—'})</div></div>
                    </div>
                </div>

                <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={18} /> Salary Structure Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px', background: 'var(--bg-primary)', padding: 16, borderRadius: 8 }}>
                            <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Basic Salary</div><div style={{ fontSize: 16, fontWeight: 500 }}>₹{Number(currentStructure.basic || 0).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>HRA</div><div style={{ fontSize: 16 }}>₹{Number(currentStructure.hra || 0).toLocaleString()}</div></div>
                            <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DA + Allowances</div><div style={{ fontSize: 16 }}>₹{(Number(currentStructure.da || 0) + Number(currentStructure.allowances || 0)).toLocaleString()}</div></div>
                            <div style={{ gridColumn: '1 / 3' }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gross Pay</div><div style={{ fontSize: 20, color: 'var(--blue-light)', fontWeight: 600 }}>₹{gross.toLocaleString()}</div></div>
                            <div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PF Amount</div><div style={{ fontSize: 16, color: 'var(--red-light)' }}>₹{pfAmount.toLocaleString()}</div></div>
                            <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Net Pay (latest)</div><div style={{ fontSize: 18, fontWeight: 500, color: 'var(--teal-light)' }}>₹{Number(netPay || 0).toLocaleString()}</div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div>
                    <h3 style={{ marginBottom: 16 }}>Attendance Summary (this month)</h3>
                    <div className="card" style={{ padding: 16, display: 'flex', gap: '24px', justifyContent: 'space-around' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="stat-value" style={{ fontSize: 20 }}>{profile.attendanceSummary?.presentDays || 0}</div>
                            <div className="stat-label">Present</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div className="stat-value" style={{ fontSize: 20 }}>{profile.attendanceSummary?.absentDays || 0}</div>
                            <div className="stat-label">Absent</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div className="stat-value" style={{ fontSize: 20 }}>{profile.attendanceSummary?.leaves || 0}</div>
                            <div className="stat-label">Leaves</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Last 6 Months Salary History</h3>
                    <DataTable data={profile.salarySheets?.slice(0, 6) || []} columns={salaryCols} perPage={6} emptyMessage="No salary sheets found" />
                </div>
                <div>
                    <h3 style={{ marginBottom: 16 }}>Advance Memos</h3>
                    <DataTable data={profile.advanceMemos || []} columns={memoCols} perPage={6} emptyMessage="No advance memos found" />
                </div>
            </div>
        </div>
    );
}
