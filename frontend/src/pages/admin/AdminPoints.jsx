import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminPoints() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('individual'); // 'individual' | 'team'

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold">Points</h1>

      <div className="flex text-sm rounded-full bg-surface-muted p-0.5 w-fit">
        <button
          onClick={() => setTab('individual')}
          className={`px-4 py-1.5 rounded-full font-semibold ${tab === 'individual' ? 'bg-brand text-white' : 'text-ink/60'}`}
        >
          Individual
        </button>
        <button
          onClick={() => setTab('team')}
          className={`px-4 py-1.5 rounded-full font-semibold ${tab === 'team' ? 'bg-brand text-white' : 'text-ink/60'}`}
        >
          Team
        </button>
      </div>

      {tab === 'individual' ? <IndividualPoints showToast={showToast} /> : <TeamPoints showToast={showToast} />}
    </div>
  );
}

function IndividualPoints({ showToast }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'MEMBER' } }).then((res) => {
      setUsers(res.data.users);
      if (res.data.users.length) setUserId(res.data.users[0].id);
    });
  }, []);

  useEffect(() => {
    if (userId) api.get(`/points/history/${userId}`).then((res) => setHistory(res.data.transactions));
  }, [userId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!userId || !amount) return;
    setSubmitting(true);
    try {
      await api.post('/points/adjust', { userId, amount: Number(amount), reason });
      const selected = users.find((u) => u.id === userId);
      showToast(`${Number(amount) > 0 ? '+' : ''}${amount} points given to ${selected?.fullName}`);
      setAmount('');
      setReason('');
      const res = await api.get(`/points/history/${userId}`);
      setHistory(res.data.transactions);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not adjust points', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTotal = history.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <section className="app-card p-5">
        <h2 className="font-display text-lg font-bold mb-4">Give / Remove Points — Member</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Member</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50 or -10" required className="w-full rounded-xl border border-black/10 px-3 py-2" />
            <p className="text-xs text-ink/40 mt-1">Use a negative number to deduct points. This never affects the member's team total.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Won football game" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          </div>
          <button disabled={submitting} className="w-full bg-brand text-white font-bold rounded-full py-2.5 disabled:opacity-60">
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </form>
      </section>

      <section className="app-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold">History</h3>
          <span className="text-sm font-semibold text-ink/50">Current total: {currentTotal}</span>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-ink/40">No point transactions for this member yet.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {history.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{t.reason || t.sourceType}</p>
                  <p className="text-xs text-ink/40">{new Date(t.createdAt).toLocaleString()} · {t.sourceType}</p>
                </div>
                <span className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.amount >= 0 ? `+${t.amount}` : t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TeamPoints({ showToast }) {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/teams').then((res) => {
      setTeams(res.data.teams);
      if (res.data.teams.length) setTeamId(res.data.teams[0].id);
    });
  }, []);

  useEffect(() => {
    if (teamId) api.get(`/teams/${teamId}/points/history`).then((res) => setHistory(res.data.transactions));
  }, [teamId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!teamId || !amount) return;
    setSubmitting(true);
    try {
      await api.post(`/teams/${teamId}/points/adjust`, { amount: Number(amount), reason });
      const selected = teams.find((t) => t.id === teamId);
      showToast(`${Number(amount) > 0 ? '+' : ''}${amount} points given to ${selected?.name}`);
      setAmount('');
      setReason('');
      const res = await api.get(`/teams/${teamId}/points/history`);
      setHistory(res.data.transactions);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not adjust team points', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentTotal = history.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <section className="app-card p-5">
        <h2 className="font-display text-lg font-bold mb-4">Give / Remove Points — Team (Today)</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2">
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50 or -10" required className="w-full rounded-xl border border-black/10 px-3 py-2" />
            <p className="text-xs text-ink/40 mt-1">This is a separate ledger from member points — it never touches any individual's total, and vice versa.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Won relay race" className="w-full rounded-xl border border-black/10 px-3 py-2" />
          </div>
          <button disabled={submitting} className="w-full bg-brand text-white font-bold rounded-full py-2.5 disabled:opacity-60">
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </form>
      </section>

      <section className="app-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold">History</h3>
          <span className="text-sm font-semibold text-ink/50">Current total: {currentTotal}</span>
        </div>
        {teams.length === 0 && <p className="text-sm text-ink/40">No teams created for today yet — create one under Staff Dashboard → Teams first.</p>}
        {teams.length > 0 && history.length === 0 && <p className="text-sm text-ink/40">No point transactions for this team yet.</p>}
        {history.length > 0 && (
          <ul className="divide-y divide-black/5">
            {history.map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{t.reason || 'Manual'}</p>
                  <p className="text-xs text-ink/40">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.amount >= 0 ? `+${t.amount}` : t.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}