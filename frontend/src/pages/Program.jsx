import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Program() {
  const [eventDays, setEventDays] = useState([]);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    api.get('/program').then((res) => setEventDays(res.data.eventDays));
  }, []);

  if (eventDays.length === 0) return <div className="text-ink/40">Loading…</div>;

  const day = eventDays[activeDay];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {eventDays.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            className={`px-4 py-2 rounded-full text-sm font-semibold  ${
              i === activeDay ? 'bg-brand text-white' : 'hover:bg-surface text-surface hover:text-ink '
            }`}
          >
            Day {d.dayNumber}
          </button>
        ))}
      </div>

      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold mb-4">
          {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>
        {day.programItems.length === 0 ? (
          <p className="text-sm text-ink/50">Program not published for this day yet.</p>
        ) : (
          <ol className="space-y-3">
            {day.programItems.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="font-mono font-bold text-brand w-14 shrink-0">
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  {item.location && <p className="text-sm text-ink/40">{item.location}</p>}
                  {item.description && <p className="text-sm text-ink/60 mt-0.5">{item.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
