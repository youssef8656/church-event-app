import { useEffect, useState } from 'react';
import api from '../services/api';

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'PHOTO', label: 'Photos' },
  { key: 'PDF', label: 'PDFs' },
  { key: 'PRESENTATION', label: 'Slides' },
  { key: 'OTHER', label: 'Other' },
];

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

export default function Media() {
  const [category, setCategory] = useState(null);
  const [media, setMedia] = useState([]);

  useEffect(() => {
    api.get('/media', { params: category ? { category } : {} }).then((res) => setMedia(res.data.media));
  }, [category]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold text-brand">Media</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
              category === c.key ? 'bg-brand text-white' : 'text-surface hover:bg-surface hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {media.length === 0 ? (
        <p className="text-sm text-ink/50 text-brand-dark">No media published in this category yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {media.map((m) => (
            <a
              key={m.id}
              href={`${API_ORIGIN}${m.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className="app-card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">{iconFor(m.category)}</span>
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.title}</p>
                {m.description && <p className="text-sm text-ink/50 truncate">{m.description}</p>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function iconFor(category) {
  return { PHOTO: '🖼️', PDF: '📄', PRESENTATION: '📊', OTHER: '📁' }[category] || '📁';
}
