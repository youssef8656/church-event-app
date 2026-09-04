import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(fullName, email, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
        <div className="app-card w-full max-w-sm p-6 text-center">
          <h1 className="font-display text-xl font-extrabold text-brand mb-2">Check your email</h1>
          <p className="text-sm text-ink/60">We sent a verification link to {email}. Verify it, then log in.</p>
          <button onClick={() => navigate('/login')} className="mt-5 text-brand font-semibold text-sm">
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <form onSubmit={handleSubmit} className="app-card w-full max-w-sm p-6">
        <h1 className="font-display text-2xl font-extrabold text-brand mb-1">Join the event</h1>
        <p className="text-sm text-ink/50 mb-5">Create your account to register.</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <label className="block text-sm font-semibold mb-1">Full name</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full mb-3 rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />

        <label className="block text-sm font-semibold mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />

        <label className="block text-sm font-semibold mb-1">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />

        <button
          disabled={submitting}
          className="w-full bg-brand text-white font-bold rounded-full py-2.5 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-sm text-ink/50 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-brand font-semibold">Log in</Link>
        </p>
      </form>
    </div>
  );
}
