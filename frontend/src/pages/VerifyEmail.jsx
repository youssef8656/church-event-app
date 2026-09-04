import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'This link is invalid or expired.');
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div className="app-card w-full max-w-sm p-6 text-center">
        {status === 'verifying' && <p className="text-ink/50">Verifying your email…</p>}

        {status === 'success' && (
          <>
            <h1 className="font-display text-xl font-extrabold text-brand mb-2">Email verified 🎉</h1>
            <p className="text-sm text-ink/60">You're all set. You can log in now.</p>
            <Link to="/login" className="inline-block mt-5 bg-brand text-white font-bold rounded-full px-6 py-2.5">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="font-display text-xl font-extrabold mb-2">Verification failed</h1>
            <p className="text-sm text-ink/60">{message}</p>
            <Link to="/login" className="inline-block mt-5 text-brand font-semibold text-sm">
              Back to Login →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
