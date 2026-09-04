import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Profile() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/users/me/profile').then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-5">
      <section className="app-card p-6">
        <h1 className="font-display text-xl font-extrabold">{data.user.fullName}</h1>
        <p className="text-sm text-ink/50">{data.user.email}</p>
      </section>

      <section className="app-card p-5 grid grid-cols-2 gap-4">
        <Info label="Team" value={data.team?.name || '—'} />
        <Info label="Room" value={data.room?.label || '—'} />
        <Info label="Points" value={data.points} />
        <Info label="Rank" value={data.rank ? `#${data.rank}` : '—'} />
      </section>

      {data.room?.roommates?.length > 0 && (
        <section className="app-card p-5">
          <h2 className="font-display font-bold mb-2">Roommates</h2>
          <ul className="text-sm space-y-1">
            {data.room.roommates.map((r) => (
              <li key={r.id}>{r.fullName}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="app-card p-5">
        <h2 className="font-display font-bold mb-2">Your Tasks</h2>
        {data.tasks.length === 0 ? (
          <p className="text-sm text-ink/50">No tasks assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.tasks.map((t) => (
              <li key={t.id} className="flex justify-between text-sm">
                <span>{t.title}</span>
                <span className="text-ink/40">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/40">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
