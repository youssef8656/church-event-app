import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

const SCANNER_ID = 'qr-scanner-region';

export default function Scanner() {
  const [meetings, setMeetings] = useState([]);
  const [meetingId, setMeetingId] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const html5QrRef = useRef(null);
  const busyRef = useRef(false); // guards against double-processing the same frame

  useEffect(() => {
    api.get('/meetings').then((res) => {
      setMeetings(res.data.meetings);
      if (res.data.meetings.length) setMeetingId(res.data.meetings[0].id);
    });
  }, []);

  useEffect(() => {
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  const startScanning = async () => {
    if (!meetingId) return;
    const qr = new Html5Qrcode(SCANNER_ID);
    html5QrRef.current = qr;
    setScanning(true);
    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          if (busyRef.current) return; // ignore rapid repeat frames of the same code
          busyRef.current = true;
          await handleScan(decodedText);
          // Ready for the next person immediately — no restart required.
          setTimeout(() => {
            busyRef.current = false;
          }, 1200);
        },
        () => {} // ignore per-frame decode failures (normal while aiming)
      );
    } catch (err) {
      setResult({ error: 'Could not access camera. Check permissions.' });
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    await html5QrRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  const handleScan = async (qrToken) => {
    try {
      const { data } = await api.post('/attendance/scan', { qrToken, meetingId });
      setResult(data);
    } catch (err) {
      setResult({ error: err.response?.data?.error?.message || 'Scan failed' });
    }
  };

  return (
    <div className="space-y-5">
      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold mb-3">QR Scanner</h1>

        <label className="block text-sm font-semibold mb-1">Meeting</label>
        <select
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          disabled={scanning}
          className="w-full mb-4 rounded-xl border border-black/10 px-3 py-2"
        >
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} — {new Date(m.startTime).toLocaleTimeString()}
            </option>
          ))}
        </select>

        <div id={SCANNER_ID} className="rounded-xl overflow-hidden bg-black/5 min-h-[250px]" />

        <button
          onClick={scanning ? stopScanning : startScanning}
          className="mt-4 w-full bg-brand text-white font-bold rounded-full py-2.5"
        >
          {scanning ? 'Stop Scanner' : 'Start Scanner'}
        </button>
      </section>

      {result && (
        <section className={`app-card p-5 ${result.error ? 'border-2 border-red-300' : result.alreadyCheckedIn ? 'border-2 border-amber-300' : 'border-2 border-green-300'}`}>
          {result.error ? (
            <p className="font-semibold text-red-600">✗ {result.error}</p>
          ) : (
            <>
              <p className="font-semibold">
                {result.alreadyCheckedIn ? 'Already checked in' : '✓ Check-in successful'}
              </p>
              <p className="text-lg font-bold mt-1">{result.user.fullName}</p>
              <p className="text-sm text-ink/60">{result.meeting.title}</p>
              <p className="text-sm text-ink/60">
                {new Date(result.checkInAt).toLocaleTimeString([], { hour12: false })}
              </p>
              {result.pointsAwarded > 0 && (
                <p className="text-brand font-bold mt-1">+{result.pointsAwarded} points</p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
