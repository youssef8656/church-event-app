import { useState } from 'react';

// EDIT THIS to change the program. Each day has a label (shown on the tab),
// a dateLabel (shown as the heading), and a list of items — just add,
// remove, or edit lines here, nothing else in this file needs to change.
const PROGRAM = [
  {
    label: 'Day 1',
    dateLabel: 'Wednesday, October 1',
    items: [
      { time: '12:30', endTime: '02:30', title: 'هبوط اضطراري', location: 'Main Hall' },
      { time: '03:00', endTime: '04:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '04:00', endTime: '06:00', title: 'Transit', location: 'Main Hall' },
      { time: '06:30', endTime: '07:00', title: 'Soft drinks', location: 'Main Hall' },
      { time: '07:00', endTime: '08:00', title: 'Flight mood', location: 'Main Hall' },
      { time: '08:00', endTime: '09:00', title: 'Lottery', location: 'Main Hall' },
      { time: '09:00', endTime: '10:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '10:00', endTime: '12:00', title: 'For fun', location: 'Main Hall' },
    ],
  },
  {
    label: 'Day 2',
    dateLabel: 'Thursday, October 2',
    items: [
      { time: '08:30', endTime: '09:00', title: 'برجاء ربط الاحزمه', location: 'Main Hall' },
      { time: '09:30', endTime: '09:30', title: 'TYT', location: 'Main Hall' },
      { time: '09:30', endTime: '10:30', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '10:30', endTime: '11:30', title: 'Flight mood', location: 'Main Hall' },
      { time: '11:30', endTime: '12:30', title: 'SOS', location: 'Main Hall' },
      { time: '12:30', endTime: '02:30', title: 'هبوط اضطراري', location: 'Main Hall' },
      { time: '03:00', endTime: '04:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '04:00', endTime: '06:00', title: 'Transit', location: 'Main Hall' },
      { time: '06:30', endTime: '07:00', title: 'Soft drinks', location: 'Main Hall' },
      { time: '07:00', endTime: '08:00', title: 'Flight mood', location: 'Main Hall' },
      { time: '08:00', endTime: '09:00', title: 'A-Class', location: 'Main Hall' },
      { time: '09:00', endTime: '10:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '10:00', endTime: '11:00', title: 'Parachute', location: 'Main Hall' },
      { time: '11:00', endTime: '12:00', title: 'For fun', location: 'Main Hall' },
    ],
  },
  {
    label: 'Day 3',
    dateLabel: 'Friday, October 3',
    items: [
      { time: '08:30', endTime: '09:00', title: 'برجاء ربط الاحزمه', location: 'Main Hall' },
      { time: '09:30', endTime: '09:30', title: 'TYT', location: 'Main Hall' },
      { time: '09:30', endTime: '10:30', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '10:30', endTime: '11:30', title: 'Flight mood', location: 'Main Hall' },
      { time: '11:30', endTime: '12:30', title: 'الصندوق الاسود', location: 'Main Hall' },
      { time: '12:30', endTime: '02:30', title: 'هبوط اضطراري', location: 'Main Hall' },
      { time: '03:00', endTime: '04:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '04:00', endTime: '06:00', title: 'Transit', location: 'Main Hall' },
      { time: '06:30', endTime: '07:00', title: 'Soft drinks', location: 'Main Hall' },
      { time: '07:00', endTime: '08:00', title: 'Flight mood', location: 'Main Hall' },
      { time: '08:00', endTime: '09:00', title: 'مطب هوا', location: 'Main Hall' },
      { time: '09:00', endTime: '10:00', title: 'Beef or Chicken', location: 'Main Hall' },
      { time: '10:00', endTime: '11:00', title: 'Attention', location: 'Main Hall' },
      { time: '11:00', endTime: '12:00', title: 'آخر نداء', location: 'Main Hall' },
    ],
  },
];

export default function Program() {
  const [activeDay, setActiveDay] = useState(0);
  const day = PROGRAM[activeDay];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {PROGRAM.map((d, i) => (
          <button
            key={d.label}
            onClick={() => setActiveDay(i)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              i === activeDay ? 'bg-brand text-ink' : 'hover:bg-surface text-surface hover:text-ink'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold mb-4">{day.dateLabel}</h1>
        {day.items.length === 0 ? (
          <p className="text-sm text-ink/50">Program not published for this day yet.</p>
        ) : (
          <ol className="space-y-3">
            {day.items.map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="font-mono font-bold text-brand-dark w-24 shrink-0">
                  {item.time}
                  {item.endTime && <span className="text-ink/40"> – {item.endTime}</span>}
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