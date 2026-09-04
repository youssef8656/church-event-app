import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminAnnouncements() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const load = () => api.get('/announcements').then((res) => setAnnouncements(res.data.announcements));

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', { title, content, isPinned });
      setTitle('');
      setContent('');
      setIsPinned(false);
      load();
      showToast('Announcement published — members notified.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not publish announcement', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/announcements/${pendingDeleteId}`);
      setPendingDeleteId(null);
      load();
      showToast('Announcement deleted');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete announcement', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Announcements</h1>

      <form onSubmit={create} className="app-card p-5 space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required className="w-full rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          Pin this announcement
        </label>
        <button className="bg-brand text-white font-bold rounded-full px-5 py-2.5">Publish</button>
        <p className="text-xs text-ink/40">Publishing notifies every member in-app immediately.</p>
      </form>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="app-card p-4 flex items-start justify-between">
            <div>
              <p className="font-semibold">{a.isPinned ? '📌 ' : ''}{a.title}</p>
              <p className="text-sm text-ink/60">{a.content}</p>
            </div>
            <button onClick={() => setPendingDeleteId(a.id)} className="text-red-500 text-sm font-semibold shrink-0 ml-3">
              Delete
            </button>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-sm text-ink/40">No announcements published yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this announcement?"
        body="Members will no longer see it. This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
