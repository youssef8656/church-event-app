import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminTeams() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#FF5A5F');
  const [eventDayId, setEventDayId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    const [teamsRes, homeRes] = await Promise.all([api.get('/teams'), api.get('/home')]);
    setTeams(teamsRes.data.teams);
    setEventDayId(homeRes.data.eventDay.id);
  };

  useEffect(() => {
    load();
    api.get('/admin/users', { params: { role: 'MEMBER' } }).then((res) => setUsers(res.data.users));
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', { eventDayId, name, colorHex });
      setName('');
      load();
      showToast('Team created');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not create team', 'error');
    }
  };

  const assignUser = async (teamId, userId) => {
    if (!userId) return;
    await api.post(`/teams/${teamId}/assign`, { userId });
    load();
  };

  const confirmDeleteTeam = async () => {
    try {
      await api.delete(`/teams/${pendingDelete.id}`);
      showToast(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete team', 'error');
    }
  };

  const assignedUserIds = new Set(teams.flatMap((t) => t.assignments.map((a) => a.user.id)));
  const unassigned = users.filter((u) => !assignedUserIds.has(u.id));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Teams — Today</h1>

      <form onSubmit={createTeam} className="app-card p-5 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-semibold mb-1">Team name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Color</label>
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-14 rounded-lg border border-black/10" />
        </div>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Create Team</button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {teams.map((t) => (
          <div key={t.id} className="app-card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: t.colorHex }} />
                <h2 className="font-display font-bold">{t.name}</h2>
              </div>
              <button onClick={() => setPendingDelete(t)} className="text-red-500 text-xs font-semibold">
                Delete
              </button>
            </div>
            <ul className="text-sm space-y-1 mb-3">
              {t.assignments.map((a) => (
                <li key={a.id}>{a.user.fullName}</li>
              ))}
              {t.assignments.length === 0 && <p className="text-ink/40">No members yet.</p>}
            </ul>
            <select
              onChange={(e) => assignUser(t.id, e.target.value)}
              value=""
              className="w-full rounded-xl border border-black/10 px-3 py-1.5 text-sm"
            >
              <option value="" disabled>Assign a member…</option>
              {unassigned.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
        ))}
        {teams.length === 0 && <p className="text-sm text-ink/40">No teams created for today yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete team "${pendingDelete?.name}"?`}
        body="Members assigned to it will lose their team for today. This can't be undone."
        onConfirm={confirmDeleteTeam}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}