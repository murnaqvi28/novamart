import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirect = params.get('redirect') || '/';

  if (user) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); navigate(redirect, { replace: true }); }
    catch (err) { setError(err.details[0]?.message || err.message); setBusy(false); }
  };

  return (
    <div className="auth" data-testid="login-page">
      <form className="auth__card" onSubmit={submit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Log in to view your cart and orders.</p>
        {error && <div className="alert alert--error" role="alert" data-testid="login-error">{error}</div>}
        <label className="field"><span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="login-email" />
        </label>
        <label className="field"><span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="login-password" />
        </label>
        <button className="btn btn--primary btn--block btn--lg" disabled={busy} data-testid="login-submit">{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="auth__switch">New to NovaMart? <Link to={`/register${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="link" data-testid="go-register">Create an account</Link></p>
      </form>
    </div>
  );
}
