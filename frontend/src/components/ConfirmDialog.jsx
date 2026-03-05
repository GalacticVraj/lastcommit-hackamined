/**
 * ConfirmDialog — reusable confirmation modal for delete and status-change actions.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onConfirm   () => void  (async ok)
 *   title       string
 *   message     string | ReactNode
 *   confirmLabel string     default "Confirm"
 *   confirmClass string     default "btn-danger"
 *   loading     boolean
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Action', message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', loading = false }) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', width: '90vw' }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '18px' }}>{title}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                        {message || 'Are you sure you want to proceed? This cannot be undone.'}
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        className={`btn ${confirmClass}`}
                        onClick={onConfirm}
                        disabled={loading}
                        style={{ minWidth: '100px' }}
                    >
                        {loading ? 'Please wait…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
