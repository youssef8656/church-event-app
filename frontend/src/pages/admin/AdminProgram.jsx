import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminProgram() {
  const { showToast } = useToast();
  const [eventDays, setEventDays] = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const load = () => api.get('/program').then((res) => setEventDays(res.data.eventDays));

  useEffect(() => {
    load();
  }, []);

  const day = eventDays[activeDay];

  const createItem = async (e) => {
    e.preventDefault();
    const [h, m] = time.split(':');
    const itemTime = new Date(day.date);
    itemTime.setHours(Number(h), Number(m), 0, 0);
    try {
      await api.post('/program', {
        eventDayId: day.id,
        time: itemTime.toISOString(),
        title,
        location,
        sortOrder: day.programItems.length,
      });
      setTitle('');
      setLocation('');
      load();
      showToast('Program item added');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not add item', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/program/${pendingDeleteId}`);
      setPendingDeleteId(null);
      load();
      showToast('Program item deleted');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete item', 'error');
    }
  };

  if (eventDays.length === 0) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Program</h1>

      <div className="flex gap-2">
        {eventDays.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              i === activeDay ? 'bg-brand text-white' : 'bg-surface-muted text-ink/60'
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      <form onSubmit={createItem} className="app-card p-5 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-semibold mb-1">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Add Item</button>
      </form>

      <div className="app-card divide-y divide-black/5">
        {day.programItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">
                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {item.title}
              </p>
              {item.location && <p className="text-sm text-ink/50">{item.location}</p>}
            </div>
            <button onClick={() => setPendingDeleteId(item.id)} className="text-red-500 text-sm font-semibold">
              Delete
            </button>
          </div>
        ))}
        {day.programItems.length === 0 && <p className="p-4 text-sm text-ink/40">No program items for this day yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this program item?"
        body="Members will no longer see it on the Program page."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
