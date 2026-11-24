import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const notify = useToast();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const redirect = params.get('redirect') || '/';

  if (user) return <Navigate to={redirect} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setErrors({});
    if (form.password !== form.confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      notify('Account created — welcome to NovaMart!');
      navigate(redirect, { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors); if (!err.details.length) setError(err.message); setBusy(false);
    }
  };


  return (
    <div className="auth" data-testid="register-page">
      <form className="auth__card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Track orders and check out faster.</p>
        {error && <div className="alert alert--error" role="alert" data-testid="register-error">{error}</div>}
        {[
          ['name', 'Full name', 'text', 'name'],
          ['email', 'Email', 'email', 'email'],
          ['password', 'Password', 'password', 'new-password'],
          ['confirm', 'Confirm password', 'password', 'new-password'],
        ].map(([k, label, type, ac]) => (
          <label key={k} className={`field ${errors[k] ? 'field--invalid' : ''}`}><span>{label}</span>
            <input type={type} value={form[k]} onChange={set(k)} autoComplete={ac} data-testid={`register-${k}`} aria-invalid={!!errors[k]} />
            {k === 'password' && !errors[k] && <span className="hint">At least 8 characters, with a letter and a number</span>}
            {errors[k] && <span className="field-error" data-testid={`register-error-${k}`}>{errors[k]}</span>}
          </label>
        ))}
        <button className="btn btn--primary btn--block btn--lg" disabled={busy} data-testid="register-submit">{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="auth__switch">Already have an account? <Link to="/login" className="link" data-testid="go-login">Log in</Link></p>
      </form>
    </div>
  );
}
