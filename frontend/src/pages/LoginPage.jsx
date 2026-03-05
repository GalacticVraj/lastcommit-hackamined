import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Loader2 } from 'lucide-react';
import useAuthStore from '../lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('admin@erp.com');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore(s => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome to TechMicra ERP!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <BarChart3 size={40} style={{ color: '#FF9F43' }} />
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
                <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.3)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--gray-600)', margin: 0 }}>
                        <strong style={{ color: 'var(--gray-800)' }}>Demo Credentials:</strong><br />
                        Admin: admin@erp.com / password<br />
                        Sales: sales@erp.com / password
                    </p>
                </div>
            </div>
        </div>
    );
}
