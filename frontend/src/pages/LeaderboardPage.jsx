import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [teamScope, setTeamScope] = useState('CUMULATIVE');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get('/leaderboard/individual').then((res) => setRows(res.data.leaderboard));
  }, []);

  useEffect(() => {
    api.get(`/leaderboard/teams?scope=${teamScope}`).then((res) => setTeams(res.data.leaderboard));
  }, [teamScope]);

  return (
    <div className="space-y-5">
      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold mb-4">🏆 Individual Leaderboard</h1>
        <ol className="divide-y divide-black/5">
          {rows.map((row) => (
            <li
              key={row.userId}
              className={`flex items-center justify-between py-2.5 ${
                row.userId === user?.id ? 'bg-brand/5 -mx-2 px-2 rounded-lg' : ''
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-8 text-center font-bold text-ink/40">#{row.rank}</span>
                <span className="font-medium">{row.fullName}</span>
              </span>
              <span className="text-sm font-semibold">{row.points} pts</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="app-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Team Ranking</h2>
          <div className="flex text-xs rounded-full bg-surface-muted p-0.5">
            <button
              onClick={() => setTeamScope('TODAY')}
              className={`px-2.5 py-1 rounded-full font-semibold ${teamScope === 'TODAY' ? 'bg-brand text-white' : 'text-ink/60'}`}
            >
              Today
            </button>
            <button
              onClick={() => setTeamScope('CUMULATIVE')}
              className={`px-2.5 py-1 rounded-full font-semibold ${teamScope === 'CUMULATIVE' ? 'bg-brand text-white' : 'text-ink/60'}`}
            >
              All Days
            </button>
          </div>
        </div>
        <ol className="space-y-2">
          {teams.map((t) => (
            <li key={t.teamId} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: t.colorHex || '#999' }} />
                #{t.rank} {t.teamName}
              </span>
              <span className="font-semibold">{t.points} pts</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
