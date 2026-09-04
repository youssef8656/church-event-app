import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const load = () => api.get('/tasks').then((res) => setTasks(res.data.tasks));

  useEffect(() => {
    load();
    api.get('/admin/users', { params: { role: 'MEMBER' } }).then((res) => setUsers(res.data.users));
  }, []);

  const toggleUser = (id) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    await api.post('/tasks', { title, description, points: Number(points), userIds: selectedUserIds });
    setTitle('');
    setDescription('');
    setSelectedUserIds([]);
    load();
  };

  const verify = async (taskId, userId) => {
    await api.patch(`/tasks/${taskId}/assignments/${userId}/verify`);
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Tasks</h1>

      <form onSubmit={createTask} className="app-card p-5 space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Points</label>
          <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="w-24 rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Assign to</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {users.map((u) => (
              <button
                type="button"
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`text-sm px-3 py-1.5 rounded-full ${
                  selectedUserIds.includes(u.id) ? 'bg-brand text-white' : 'bg-surface-muted text-ink/60'
                }`}
              >
                {u.fullName}
              </button>
            ))}
          </div>
        </div>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Create & Assign</button>
      </form>

      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="app-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">{t.title}</h2>
              <span className="text-sm text-ink/50">{t.points} pts</span>
            </div>
            {t.description && <p className="text-sm text-ink/60 mt-1">{t.description}</p>}
            <ul className="mt-3 space-y-1.5">
              {t.assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.user.fullName}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-muted">{a.status}</span>
                    {a.status === 'COMPLETED' && (
                      <button onClick={() => verify(t.id, a.user.id)} className="text-brand font-semibold">
                        Verify
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
