import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [teamScope, setTeamScope] = useState('TODAY');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/home');
      setData(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not load your home feed.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Something went wrong" body={error} />;
  if (!data) return <Skeleton />;

  const teamLeaderboard = teamScope === 'TODAY' ? data.teamLeaderboard.today : data.teamLeaderboard.cumulative;

  return (
    <div className="space-y-5">
      {/* Event header */}
      <section className="app-card p-5 bg-gradient-to-br from-brand to-brand-dark text-white">
        <p className="text-sm font-semibold opacity-90">Event Day {data.eventDay.dayNumber}</p>
        <h1 className="font-display text-2xl font-extrabold mt-0.5">{data.event.name}</h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <StatPill label="Team" value={data.team?.name || '—'} />
          <StatPill label="Points" value={data.points} />
          <StatPill label="Rank" value={data.rank ? `#${data.rank}` : '—'} />
        </div>
        <Link
          to="/check-in"
          className="mt-4 inline-flex items-center justify-center w-full bg-white text-brand-dark font-bold rounded-full py-2.5"
        >
          Quick Check-In →
        </Link>
      </section>

      {/* Notifications */}
      {data.notifications.length > 0 && (
        <section className="app-card p-4">
          <h2 className="font-display font-bold mb-2">Notifications</h2>
          <ul className="space-y-1.5">
            {data.notifications.map((n) => (
              <li key={n.id} className="text-sm flex gap-2">
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Announcements */}
      <section className="app-card p-5">
        <h2 className="font-display text-xl font-bold mb-3">Today's Announcements</h2>
        {data.announcements.length === 0 ? (
          <p className="text-ink/50 text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {data.announcements.map((a) => (
              <div key={a.id} className="border-l-4 border-accent pl-3">
                <p className="font-semibold">{a.isPinned ? '📌 ' : ''}{a.title}</p>
                <p className="text-sm text-ink/60">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Program */}
      <section className="app-card p-5">
        <h2 className="font-display text-xl font-bold mb-3">Today's Program</h2>
        {data.program.length === 0 ? (
          <p className="text-ink/50 text-sm">Program has not been published yet.</p>
        ) : (
          <ol className="space-y-2">
            {data.program.map((p) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <span className="font-mono font-semibold text-brand w-14">
                  {new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex-1">{p.title}</span>
                {p.location && <span className="text-ink/40">{p.location}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Leaderboard preview (Top 5 + your rank + team ranking) */}
      <Leaderboard
        top5={data.leaderboard.top5}
        myRank={data.leaderboard.myRank}
        currentUserId={user?.id}
        teamLeaderboard={teamLeaderboard}
        teamScope={teamScope}
        onTeamScopeChange={setTeamScope}
      />
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="bg-white/15 rounded-xl py-2">
      <p className="text-lg font-extrabold font-display">{value}</p>
      <p className="text-[11px] uppercase tracking-wide opacity-80">{label}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="app-card h-40 bg-surface-muted" />
      <div className="app-card h-32 bg-surface-muted" />
      <div className="app-card h-32 bg-surface-muted" />
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="app-card p-8 text-center">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="text-ink/50 text-sm mt-1">{body}</p>
    </div>
  );
}
