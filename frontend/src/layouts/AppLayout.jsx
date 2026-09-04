import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PRIMARY_NAV = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/check-in', label: 'Check In', icon: '📷' },
  { to: '/program', label: 'Program', icon: '🗓️' },
  { to: '/leaderboard', label: 'Ranks', icon: '🏆' },
];

const MORE_NAV = [
  { to: '/leagues', label: 'Leagues', icon: '⚽' },
  { to: '/media', label: 'Media', icon: '🖼️' },
  { to: '/food', label: 'Food', icon: '🍽️' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    api.get('/notifications').then((res) => {
      setUnreadCount(res.data.notifications.filter((n) => !n.isRead).length);
    }).catch(() => {});
  }, []);

  const allNav = [...PRIMARY_NAV, ...MORE_NAV];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-display text-lg font-extrabold text-brand">Youth Event</span>

          <nav className="hidden md:flex items-center gap-1">
            {allNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive ? 'bg-brand text-white' : 'text-ink/60 hover:bg-surface-muted'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {(user?.role === 'ADMIN' || user?.role === 'SERVANT') && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive ? 'bg-ink text-white' : 'text-ink/60 hover:bg-surface-muted'
                  }`
                }
              >
                Staff Dashboard
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="relative text-lg" title={`${unreadCount} unread notifications`}>
                🔔
                <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              </span>
            )}
            <button onClick={logout} className="text-sm text-ink/50 hover:text-ink">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-5 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav: 4 primary items + a More sheet for the rest */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-black/5 grid grid-cols-5">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMoreOpen(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-brand' : 'text-ink/40'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${moreOpen ? 'text-brand' : 'text-ink/40'}`}
        >
          <span className="text-lg leading-none">⋯</span>
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed bottom-16 inset-x-0 z-20 bg-surface border-t border-black/5 grid grid-cols-4 py-2">
          {MORE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-brand' : 'text-ink/40'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
