import { Link } from 'react-router-dom';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Reusable leaderboard preview. Pure presentational component driven
 * entirely by props from the backend (/api/home or /api/leaderboard/*) —
 * no hard-coded data — so it's easy to re-skin later without touching
 * how it's wired up.
 */
export default function Leaderboard({ top5, myRank, currentUserId, teamLeaderboard, teamScope, onTeamScopeChange }) {
  return (
    <div className="app-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-bold">🏆 Leaderboard</h2>
        <Link to="/leaderboard" className="text-sm font-semibold text-brand hover:text-brand-dark">
          View Full Leaderboard →
        </Link>
      </div>

      <ol className="divide-y divide-black/5">
        {top5.map((row, i) => (
          <li
            key={row.userId}
            className={`flex items-center justify-between py-2 ${
              row.userId === currentUserId ? 'bg-brand/5 -mx-2 px-2 rounded-lg' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-6 text-center">{MEDALS[i] || row.rank}</span>
              <span className="font-medium">{row.fullName}</span>
            </span>
            <span className="text-sm text-ink/60">{row.points} pts</span>
          </li>
        ))}
      </ol>

      {myRank && (
        <div className="mt-3 pt-3 border-t border-dashed border-black/10">
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-1">Your Position</p>
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              #{myRank.rank} — {myRank.fullName}
            </span>
            <span className="text-sm text-ink/60">{myRank.points} pts</span>
          </div>
        </div>
      )}

      {teamLeaderboard && (
        <div className="mt-5 pt-4 border-t border-black/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg font-bold">🏆 Team Ranking</h3>
            {onTeamScopeChange && (
              <div className="flex text-xs rounded-full bg-surface-muted p-0.5">
                <button
                  onClick={() => onTeamScopeChange('TODAY')}
                  className={`px-2.5 py-1 rounded-full font-semibold text-surface ${teamScope === 'TODAY' ? 'bg-brand text-white' : 'text-ink/60'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => onTeamScopeChange('CUMULATIVE')}
                  className={`px-2.5 py-1 rounded-full font-semibold text-surface ${teamScope === 'CUMULATIVE' ? 'bg-brand text-white' : 'text-ink/60'}`}
                >
                  All Days
                </button>
              </div>
            )}
          </div>
          <ol className="space-y-1">
            {teamLeaderboard.map((t) => (
              <li key={t.teamId} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: t.colorHex || '#999' }} />
                  {t.rank}. {t.teamName}
                </span>
                <span className="text-ink/60">{t.points} pts</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
