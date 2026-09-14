import { useEffect, useState } from 'react';
import api from '../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/api$/, '');

export default function Food() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    api.get('/restaurants').then((res) => setRestaurants(res.data.restaurants));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold text-brand">Food Nearby</h1>

      {restaurants.length === 0 ? (
        <p className="text-sm text-ink/50">No restaurants added yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {restaurants.map((r) => (
            <div key={r.id} className="app-card p-5">
              <h2 className="font-display font-bold text-lg">{r.name}</h2>
              {r.description && <p className="text-sm text-ink/60 mt-1">{r.description}</p>}
              <div className="mt-3 space-y-1 text-sm text-ink/50">
                {r.address && <p>📍 {r.address}</p>}
                {r.phone && <p>📞 {r.phone}</p>}
                {r.openingHours && <p>🕐 {r.openingHours}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.mapLink && (
                  <a href={r.mapLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand">
                    Open in Maps →
                  </a>
                )}
                {r.menus.map((m) => (
                  <a
                    key={m.id}
                    href={`${API_ORIGIN}${m.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold px-3 py-1.5 rounded-full bg-surface-muted text-ink/70"
                  >
                    View Menu
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
