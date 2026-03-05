import { Plus, InboxIcon } from 'lucide-react';

/**
 * EmptyState — displayed when a table has no data.
 *
 * Props:
 *   title    string
 *   message  string
 *   onNew    () => void  — if provided, shows a "Create" button
 *   newLabel string      — button label, default "Create New"
 */
export default function EmptyState({ title = 'No records found', message, onNew, newLabel = 'Create New' }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px 24px', textAlign: 'center'
        }}>
            <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '20px'
            }}>
                <InboxIcon size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{title}</h3>
            {message && (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '320px', lineHeight: 1.6, marginBottom: onNew ? '24px' : 0 }}>
                    {message}
                </p>
            )}
            {onNew && (
                <button className="btn btn-primary btn-sm" onClick={onNew}>
                    <Plus size={15} /> {newLabel}
                </button>
            )}
        </div>
    );
}
