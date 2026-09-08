import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../utils/ui';
import '../styles/admin.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@greengrocc.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (loginEmail, loginPassword) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/users/login', {
        email: String(loginEmail || '').trim().toLowerCase(),
        password: loginPassword,
      });
      if (response.data?.success && response.data?.data?.token) {
        const { user: authUser, token: authToken } = response.data.data;
        login(authUser, authToken);
        navigate('/');
      } else {
        setError(response.data?.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    await signIn(email, password);
  };

  return (
    <div className="admin-auth-shell flex min-h-dvh items-center justify-center px-4 py-8 text-slate-900">
      <div className={`w-full max-w-md ${PANEL} p-5 sm:p-7`}>
        <p className={PAGE_KICKER}>GreenGroo Admin</p>
        <h1 className={`mt-1 ${PAGE_TITLE}`}>Sign in to Admin Panel</h1>
        <p className={`mt-0.5 ${PAGE_SUB}`}>Enter your admin email and password to continue.</p>

        {error ? <p className="mt-3 text-xs text-[#DC2626]">{error}</p> : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
          </div>
          <button type="submit" disabled={loading} className={`w-full ${BTN_PRIMARY} py-2`}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className={`${PAGE_SUB} mb-2 text-center text-xs`}>Quick demo access</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => signIn('admin@greengrocc.com', 'admin123')} className={BTN}>
              Super Admin
            </button>
            <button type="button" onClick={() => signIn('inventory@greengrocc.com', 'admin123')} className={BTN}>
              Inventory Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
