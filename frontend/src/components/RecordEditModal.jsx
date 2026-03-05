import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

/**
 * RecordEditModal — pre-filled edit form modal.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   onSaved     () => void   — called after successful PUT (triggers table refresh)
 *   record      object       — the record to edit (pre-fills form)
 *   endpoint    string       — e.g. "/sales/customers"  →  PUT {endpoint}/{record.id}
 *   fields      [{name, label, type?, required?, options?}]
 *   title       string       — modal title
 */
export default function RecordEditModal({ open, onClose, onSaved, record, endpoint, fields = [], title }) {
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);

    // Pre-fill form when record changes
    useEffect(() => {
        if (record) {
            const initial = {};
            fields.forEach(f => {
                let val = f.key
                    ? f.key.split('.').reduce((o, k) => o?.[k], record)
                    : record[f.name];
                if (f.type === 'date' && val) {
                    // format as YYYY-MM-DD for <input type=date>
                    val = new Date(val).toISOString().split('T')[0];
                }
                initial[f.name] = val ?? '';
            });
            setForm(initial);
        }
    }, [record]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`${endpoint}/${record.id}`, form);
            toast.success('Record updated successfully');
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error updating record');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (name, value, type) => {
        setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    if (!open || !record) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '90vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>{title || 'Edit Record'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {fields.map(f => (
                                <div className="form-group" key={f.name} style={f.fullWidth ? { gridColumn: '1 / -1' } : {}}>
                                    <label className="form-label">{f.label}{f.required && ' *'}</label>
                                    {f.type === 'select' ? (
                                        <select
                                            className="form-input"
                                            value={form[f.name] || ''}
                                            onChange={e => handleChange(f.name, e.target.value, 'text')}
                                            required={f.required}
                                        >
                                            <option value="">— Select —</option>
                                            {(f.options || []).map(opt => (
                                                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                                                    {opt.label ?? opt}
                                                </option>
                                            ))}
                                        </select>
                                    ) : f.type === 'textarea' ? (
                                        <textarea
                                            className="form-input"
                                            rows={3}
                                            value={form[f.name] || ''}
                                            onChange={e => handleChange(f.name, e.target.value, 'text')}
                                            required={f.required}
                                            style={{ resize: 'vertical' }}
                                        />
                                    ) : (
                                        <input
                                            className="form-input"
                                            type={f.type || 'text'}
                                            value={form[f.name] ?? ''}
                                            onChange={e => handleChange(f.name, e.target.value, f.type)}
                                            required={f.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '130px' }}>
                            {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
