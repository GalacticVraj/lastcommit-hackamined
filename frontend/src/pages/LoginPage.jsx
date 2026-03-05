import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Loader2 } from 'lucide-react';
import useAuthStore from '../lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@erp.com');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const login = useAuthStore(s => s.login);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            await login(email, password);
            toast.success('Welcome to TechMicra ERP!');
            navigate('/dashboard');
        } catch (err) {
            setErrorMsg('Invalid email or password.');
            toast.error('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <BarChart3 size={48} style={{ color: 'var(--blue-light)' }} />
                </div>
                <h1>TechMicra ERP</h1>
                <p>Manufacturing Enterprise Resource Planning</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@erp.com" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                        {loading ? <Loader2 size={20} className="spin" /> : 'Sign In'}
                    </button>
                </form>
                {errorMsg && (
                    <div style={{ color: 'red', marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
                        {errorMsg}
                    </div>
                )}
                <div style={{ marginTop: '24px', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        <strong style={{ color: 'var(--blue-light)' }}>Demo Credentials:</strong><br />
                        Super Admin: admin@erp.com / password<br />
                        Sales User: sales@erp.com / password
                    </p>
                </div>
            </div>
        </div>
    );
}
