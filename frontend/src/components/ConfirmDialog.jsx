/**
 * Simple, reusable confirmation dialog. Renders nothing when `open` is
 * false, so it can be mounted unconditionally in a parent component.
 *
 * Usage:
 *   const [confirming, setConfirming] = useState(null); // holds the id to delete, or null
 *   <ConfirmDialog
 *     open={!!confirming}
 *     title="Delete this announcement?"
 *     body="This can't be undone."
 *     onConfirm={() => { doDelete(confirming); setConfirming(null); }}
 *     onCancel={() => setConfirming(null)}
 *   />
 */
export default function ConfirmDialog({ open, title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="app-card w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {body && <p className="text-sm text-ink/60 mt-1.5">{body}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold bg-surface-muted text-ink/70"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full py-2.5 text-sm font-bold bg-red-500 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
