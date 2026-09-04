import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/admin/audit-log').then((res) => setLogs(res.data.logs));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold">Audit Log</h1>
      <p className="text-sm text-ink/50">
        Every sensitive action — role changes, permission grants, manual point adjustments — is recorded here.
      </p>

      <div className="app-card divide-y divide-black/5">
        {logs.map((log) => (
          <div key={log.id} className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{log.action}</span>
              <span className="text-ink/40">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-ink/50 mt-0.5">
              {log.actor ? `${log.actor.fullName} (${log.actor.email})` : 'System'}
              {log.targetType && ` → ${log.targetType}:${log.targetId}`}
            </p>
            {log.metadata && (
              <pre className="text-xs bg-surface-muted rounded-lg p-2 mt-2 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="p-4 text-sm text-ink/40">No audit events recorded yet.</p>}
      </div>
    </div>
  );
}
