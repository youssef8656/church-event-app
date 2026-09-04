import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminMedia() {
  const { showToast } = useToast();
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const load = () => api.get('/media').then((res) => setMedia(res.data.media));

  useEffect(() => {
    load();
  }, []);

  const upload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showToast('Choose a file first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('description', description);

    setUploading(true);
    try {
      await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setDescription('');
      fileInputRef.current.value = '';
      load();
      showToast('Uploaded — members notified.');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/media/${pendingDeleteId}`);
      setPendingDeleteId(null);
      load();
      showToast('Media deleted');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-extrabold">Media</h1>

      <form onSubmit={upload} className="app-card p-5 space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-1">File (image, PDF, or PowerPoint)</label>
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.ppt,.pptx" required className="w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" placeholder="Defaults to file name" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" />
        </div>
        <button disabled={uploading} className="bg-brand text-white font-bold rounded-full px-5 py-2.5 disabled:opacity-60">
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="app-card divide-y divide-black/5">
        {media.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{m.title}</p>
              <p className="text-xs text-ink/40">{m.category}</p>
            </div>
            <button onClick={() => setPendingDeleteId(m.id)} className="text-red-500 text-sm font-semibold">
              Delete
            </button>
          </div>
        ))}
        {media.length === 0 && <p className="p-4 text-sm text-ink/40">No media uploaded yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this file?"
        body="It will be removed from storage and no longer visible to members."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
