
// --- New version (including the **second** grace period & points) ---

// ```diff
import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [graceMinutes, setGraceMinutes] = useState('');
  const [attendancePoints, setAttendancePoints] = useState('');
  // <<< NEW STATE VARIABLES >>> 
  const [secondGraceMinutes, setSecondGraceMinutes] = useState('');
  const [secondAttendancePoints, setSecondAttendancePoints] = useState('');
  const [saved, setSaved] = useState(false);

  const load = () =>
    api.get('/settings').then((res) => {
      setSettings(res.data.settings);
      setGraceMinutes(res.data.settings['attendance.graceMinutes']);
      setAttendancePoints(res.data.settings['attendance.points']);
      // <<< LOAD SECONDARY SETTINGS (fallback to empty string if missing) >>>
      setSecondGraceMinutes(res.data.settings['attendance.secondGraceMinutes'] || '');
      setSecondAttendancePoints(res.data.settings['attendance.secondPoints'] || '');
    });

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.put('/settings', { key: 'attendance.graceMinutes', value: graceMinutes });
    await api.put('/settings', { key: 'attendance.points', value: attendancePoints });
    // <<< SAVE SECONDARY SETTINGS >>>
    await api.put('/settings', { key: 'attendance.secondGraceMinutes', value: secondGraceMinutes });
    await api.put('/settings', { key: 'attendance.secondPoints', value: secondAttendancePoints });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load();
  };

  if (!settings) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="font-display text-xl font-extrabold">Event Settings</h1>

      <form onSubmit={save} className="app-card p-5 space-y-4">
        <p className="text-sm text-ink/50">
          These apply to any meeting that doesn't have its own override set individually.
        </p>

        {/* ---- Primary grace period & points ---- */}
        <div>
          <label className="block text-sm font-semibold mb-1">Attendance grace period (minutes)</label>
          <input
            type="number"
            min="0"
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
          <p className="text-xs text-ink/40 mt-1">
            Check-ins within this many minutes of a meeting's start earn points.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Attendance points</label>
          <input
            type="number"
            min="0"
            value={attendancePoints}
            onChange={(e) => setAttendancePoints(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
        </div>

        {/* ---- SECONDARY (smaller) grace period & points ---- */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Second attendance grace period (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={secondGraceMinutes}
            onChange={(e) => setSecondGraceMinutes(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
          <p className="text-xs text-ink/40 mt-1">
            A smaller grace period that awards fewer points.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Second attendance points</label>
          <input
            type="number"
            min="0"
            value={secondAttendancePoints}
            onChange={(e) => setSecondAttendancePoints(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
        </div>

        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">
          Save Settings
        </button>
        {saved && <span className="ml-3 text-sm text-green-600 font-semibold">Saved ✓</span>}
      </form>
    </div>
  );
}