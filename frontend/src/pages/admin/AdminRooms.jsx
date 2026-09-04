import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(4);

  const load = () => api.get('/rooms').then((res) => setRooms(res.data.rooms));

  useEffect(() => {
    load();
    api.get('/admin/users', { params: { role: 'MEMBER' } }).then((res) => setUsers(res.data.users));
  }, []);

  const createRoom = async (e) => {
    e.preventDefault();
    await api.post('/rooms', { label, capacity: Number(capacity) });
    setLabel('');
    load();
  };

  const assignUser = async (roomId, userId) => {
    if (!userId) return;
    await api.post(`/rooms/${roomId}/assign`, { userId });
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Rooms</h1>

      <form onSubmit={createRoom} className="app-card p-5 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-semibold mb-1">Room label</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} required className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Capacity</label>
          <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-20 rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Create Room</button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="app-card p-5">
            <h2 className="font-display font-bold">Room {r.label}</h2>
            <p className="text-xs text-ink/40 mb-2">Capacity: {r.capacity ?? '—'} · Occupied: {r.assignments.length}</p>
            <ul className="text-sm space-y-1 mb-3">
              {r.assignments.map((a) => (
                <li key={a.id}>{a.user.fullName}</li>
              ))}
              {r.assignments.length === 0 && <p className="text-ink/40">Empty.</p>}
            </ul>
            <select
              onChange={(e) => assignUser(r.id, e.target.value)}
              value=""
              className="w-full rounded-xl border border-black/10 px-3 py-1.5 text-sm"
            >
              <option value="" disabled>Assign a member…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
