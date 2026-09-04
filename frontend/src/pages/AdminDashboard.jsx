import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  { to: '/admin/points', label: 'Points', icon: '⭐', desc: 'Give or remove points for any member' },
  { to: '/admin/scanner', label: 'QR Scanner', icon: '📷', desc: 'Scan attendee QR codes and record check-ins' },
  { to: '/admin/users', label: 'Users', icon: '🧑‍🤝‍🧑', desc: 'Search, view, and manage roles & permissions' },
  { to: '/admin/teams', label: 'Teams', icon: '🎽', desc: 'Create teams and manage daily assignments' },
  { to: '/admin/rooms', label: 'Rooms', icon: '🛏️', desc: 'Create rooms and assign attendees' },
  { to: '/admin/tasks', label: 'Tasks', icon: '✅', desc: 'Create, assign, and verify tasks' },
  { to: '/admin/announcements', label: 'Announcements', icon: '📣', desc: 'Publish updates and news' },
  { to: '/admin/media', label: 'Media', icon: '🖼️', desc: 'Upload photos, PDFs, and slides' },
  { to: '/admin/meetings', label: 'Meetings', icon: '⏰', desc: 'Set up each day\'s meetings and check-in windows' },
  { to: '/admin/program', label: 'Program', icon: '🗓️', desc: 'Edit the published event schedule' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️', desc: 'Attendance grace period and points' },
  { to: '/admin/audit-log', label: 'Audit Log', icon: '📜', desc: 'Review sensitive actions across the system' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then((res) => setStats(res.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="space-y-5">
      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold">Staff Dashboard</h1>
        <p className="text-sm text-ink/50">
          Logged in as {user?.fullName} ({user?.role === 'ADMIN' ? 'Admin — full access' : 'Servant — permission-based access'})
        </p>
      </section>

      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Members" value={stats.totalUsers} />
          <Stat label="Check-ins Today" value={stats.attendanceToday} />
          <Stat label="Total Check-ins" value={stats.totalCheckIns} />
          <Stat label="Total Points" value={stats.totalPoints} />
          <Stat label="Teams (today)" value={stats.teamCount} />
          <Stat label="Rooms" value={stats.roomCount} />
          <Stat label="Active Leagues" value={stats.activeLeagues} />
          <Stat label="Pending Tasks" value={stats.pendingTasks} />
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className="app-card p-5 hover:shadow-md transition-shadow">
            <span className="text-2xl">{s.icon}</span>
            <p className="font-display font-bold mt-2">{s.label}</p>
            <p className="text-sm text-ink/50">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="app-card p-4 text-center">
      <p className="font-display text-2xl font-extrabold text-brand">{value}</p>
      <p className="text-xs text-ink/50 mt-0.5">{label}</p>
    </div>
  );
}
