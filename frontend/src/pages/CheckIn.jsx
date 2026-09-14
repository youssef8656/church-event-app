import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CheckIn() {
  const { user } = useAuth();
  const [qrUrl, setQrUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl;
    (async () => {
      try {
        // The QR endpoint requires the Authorization header, so it can't be
        // used directly as an <img src>. Fetch it as a blob and turn that
        // into an object URL instead.
        const [qrRes, historyRes] = await Promise.all([
          api.get('/attendance/my-qr.png', { responseType: 'blob' }),
          api.get('/attendance/my-history'),
        ]);
        objectUrl = URL.createObjectURL(qrRes.data);
        setQrUrl(objectUrl);
        setHistory(historyRes.data.history);
      } finally {
        setLoading(false);
      }
    })();
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, []);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${user?.fullName?.replace(/\s+/g, '_') || 'code'}.png`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <section className="app-card p-6 text-center">
        <h1 className="font-display text-xl font-extrabold mb-4">Your Check-In Code</h1>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-ink/40">Loading your QR code…</div>
        ) : (
          <>
            <p className="font-semibold mb-3">{user?.fullName}</p>
            <img src={qrUrl} alt="Your QR code" className="mx-auto rounded-xl border border-black/5 w-64" />
            {/* <button
              onClick={handleDownload}
              className="mt-5 bg-brand text-white font-bold rounded-full px-6 py-2.5"
            >
              Download as PNG
            </button> */}

            
            <div class="container">
              <label class="label bg-brand text-white">
                <input type="checkbox" class="input" onClick={handleDownload}/>
                <span class="circle"
                  ><svg
                    class="icon"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M12 19V5m0 14-4-4m4 4 4-4"
                    ></path>
                  </svg>
                  <div class="square"></div>
                </span>
                <p class="title text-black">Download</p>
                <p class="title">Done</p>
              </label>
            </div>


            <p className="text-xs text-ink/40 mt-3">
              Show this to event staff — it will be scanned, not scanned by you.
            </p>
          </>
        )}
      </section>

      <section className="app-card p-5">
        <h2 className="font-display text-lg font-bold mb-3">Attendance History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink/50">No check-ins recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/40 text-xs uppercase">
                <th className="py-1.5">Meeting</th>
                <th className="py-1.5">Time</th>
                <th className="py-1.5 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-black/5">
                  <td className="py-2">{h.meetingTitle}</td>
                  <td className="py-2 text-ink/60">{new Date(h.checkInAt).toLocaleTimeString()}</td>
                  <td className="py-2 text-right font-semibold">{h.pointsAwarded > 0 ? `+${h.pointsAwarded}` : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
