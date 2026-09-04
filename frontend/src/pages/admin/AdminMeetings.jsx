import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminMeetings() {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [dayId, setDayId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    api.get('/events').then((res) => {
      setEvents(res.data.events);
      const firstDay = res.data.events[0]?.eventDays[0];
      if (firstDay) setDayId(firstDay.id);
    });
  }, []);

  const loadMeetings = (id) => api.get('/meetings', { params: { eventDayId: id } }).then((res) => setMeetings(res.data.meetings));

  useEffect(() => {
    if (dayId) loadMeetings(dayId);
  }, [dayId]);

  const days = events[0]?.eventDays || [];
  const selectedDay = days.find((d) => d.id === dayId);

  const createMeeting = async (e) => {
    e.preventDefault();
    const [h, m] = time.split(':');
    const startTime = new Date(selectedDay.date);
    startTime.setHours(Number(h), Number(m), 0, 0);
    try {
      await api.post('/meetings', { eventDayId: dayId, title, startTime: startTime.toISOString(), location });
      setTitle('');
      setLocation('');
      loadMeetings(dayId);
      showToast('Meeting added');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not add meeting', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/meetings/${pendingDeleteId}`);
      setPendingDeleteId(null);
      loadMeetings(dayId);
      showToast('Meeting deleted');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete meeting', 'error');
    }
  };

  if (!selectedDay) return <div className="text-ink/40">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Meetings</h1>

      <div className="flex gap-2">
        {days.map((d) => (
          <button
            key={d.id}
            onClick={() => setDayId(d.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              d.id === dayId ? 'bg-brand text-white' : 'bg-surface-muted text-ink/60'
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      <form onSubmit={createMeeting} className="app-card p-5 flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Add Meeting</button>
      </form>

      <div className="app-card divide-y divide-black/5">
        {meetings.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-ink/50">
                {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {m.location && ` · ${m.location}`}
                {m.graceMinutes != null && ` · grace: ${m.graceMinutes}m`}
                {m.attendancePoints != null && ` · ${m.attendancePoints}pts`}
              </p>
            </div>
            <button onClick={() => setPendingDeleteId(m.id)} className="text-red-500 text-sm font-semibold">
              Delete
            </button>
          </div>
        ))}
        {meetings.length === 0 && <p className="p-4 text-sm text-ink/40">No meetings for this day yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this meeting?"
        body="Any attendance already recorded for it stays in history, but the meeting will no longer be scannable."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
