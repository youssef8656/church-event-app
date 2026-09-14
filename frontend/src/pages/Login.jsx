import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4 flex-col">
        <span className="font-display text-xl font-extrabold text-brand mb-7">Golden Ticket</span>
      <p className="text-lg font-extrabold text-center mb-4 text-3xl max-w-xl text-surface">٢١ لِذلِكَ اطْرَحُوا كُلَّ نَجَاسَةٍ وَكَثْرَةَ شَرّ، فَاقْبَلُوا بِوَدَاعَةٍ الْكَلِمَةَ الْمَغْرُوسَةَ الْقَادِرَةَ أَنْ تُخَلِّصَ نُفُوسَكُمْ. ٢٢ وَلكِنْ كُونُوا عَامِلِينَا فَقَطْ خَادِعِينَ نُفُوسَاكُمْ. (يعقوب ١: ٢١، ٢٢)</p>
      <form onSubmit={handleSubmit} className="app-card w-full max-w-sm p-6 card border border-black/10 text-brand-dark">
        <div className="inner">
        <h1 className="font-display text-2xl font-extrabold text-brand mb-1">Welcome back</h1>
        <p className="text-sm text-ink/50 mb-5">Log in to your event account.</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 rounded-xl border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />

        <button
          disabled={submitting}
          className="w-full bg-brand text-white font-bold rounded-full py-2.5 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>

        <p className="text-sm text-ink/50 mt-4 text-center">
          No account? <Link to="/register" className="text-brand font-semibold">Register</Link>
        </p>
        </div>
      </form>
    </div>
  );
}
