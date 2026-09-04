import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = () => api.get('/leagues').then((res) => setLeagues(res.data.leagues));

  useEffect(() => {
    load();
  }, []);

  const handleJoin = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/leagues/${id}/join`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not join');
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (id) => {
    setBusyId(id);
    try {
      await api.delete(`/leagues/${id}/leave`);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold">Leagues & Games</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {leagues.length === 0 ? (
        <p className="text-sm text-ink/50">No leagues published yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {leagues.map((l) => (
            <div key={l.id} className="app-card p-5">
              <div className="flex items-start justify-between">
                <h2 className="font-display font-bold text-lg">{l.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-muted text-ink/60">{l.status}</span>
              </div>
              <p className="text-sm text-ink/60 mt-1">{l.description}</p>
              <div className="mt-3 space-y-1 text-sm text-ink/50">
                {l.location && <p>📍 {l.location}</p>}
                {l.startAt && <p>🕐 {new Date(l.startAt).toLocaleString()}</p>}
                {l.maxParticipants != null && (
                  <p>👥 {l.participantCount}/{l.maxParticipants} joined ({l.availableSlots} slots left)</p>
                )}
              </div>

              {l.registrationOpen ? (
                <div className="mt-4 flex gap-2">
                  <button
                    disabled={busyId === l.id || (l.availableSlots != null && l.availableSlots <= 0)}
                    onClick={() => handleJoin(l.id)}
                    className="flex-1 bg-brand text-white font-bold rounded-full py-2 text-sm disabled:opacity-50"
                  >
                    Join
                  </button>
                  <button
                    disabled={busyId === l.id}
                    onClick={() => handleLeave(l.id)}
                    className="px-4 rounded-full py-2 text-sm font-semibold text-ink/50 bg-surface-muted"
                  >
                    Leave
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink/40">Registration closed</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
