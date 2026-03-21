import { X, Edit, Check } from 'lucide-react';

const PIPELINES = {
    'Inquiry': ['New', 'Processing', 'Quoted'],
    'Quotation': ['Draft', 'Sent', 'Accepted'],
    'Sale Order': ['Pending', 'Dispatched', 'Closed'],
    'Dispatch Advice': ['Pending', 'Dispatched', 'Delivered'],
    'Invoice': ['Unpaid', 'Partial', 'Paid'],
    'Purchase Order': ['Pending', 'Received', 'Billed', 'Closed'],
    'GRN': ['Pending', 'Inspected', 'Accepted'],
    'Bill': ['Unpaid', 'Partial', 'Paid'],
    'Route Card': ['Pending', 'WIP', 'Completed'],
    'Job Order': ['Pending', 'Dispatched', 'Received', 'Closed']
};

const PipelineBar = ({ entityType, currentStatus }) => {
    if (!currentStatus || !entityType) return null;
    const match = Object.keys(PIPELINES).find(k => (entityType || '').includes(k));
    if (!match) return null;
    
    const steps = PIPELINES[match];
    const isError = ['Lost', 'Rejected', 'Overdue', 'Cancelled'].includes(currentStatus);
    
    let currentIndex = steps.indexOf(currentStatus);
    if (isError) {
        currentIndex = steps.length - 1; 
    } else if (currentIndex === -1) {
        return null;
    }

    return (
        <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifecycle Progress</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '3px', background: 'var(--border)', zIndex: 0, borderRadius: '2px' }} />
                
                <div style={{ 
                    position: 'absolute', top: '12px', left: '10%', 
                    width: isError ? '80%' : `${Math.max(0, (currentIndex / (steps.length - 1)) * 80)}%`, 
                    height: '3px', 
                    background: isError ? 'var(--red)' : 'var(--primary)', 
                    zIndex: 0, 
                    borderRadius: '2px',
                    transition: 'width 0.4s ease-out'
                }} />

                {steps.map((step, idx) => {
                    const isActive = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;
                    const isDisplayError = isError && isCurrent;
                    
                    let circleBg = 'var(--bg-elevated)';
                    let circleBorder = 'var(--border)';
                    let color = 'var(--text-muted)';
                    
                    if (isDisplayError) {
                        circleBg = 'var(--red)';
                        circleBorder = 'var(--red)';
                        color = 'var(--white)';
                    } else if (isActive) {
                        circleBg = 'var(--primary)';
                        circleBorder = 'var(--primary)';
                        color = 'var(--white)';
                    }

                    return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '20%' }}>
                            <div style={{ 
                                width: '26px', height: '26px', borderRadius: '50%', background: circleBg, 
                                border: `2px solid ${circleBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s ease', boxShadow: !!isCurrent ? (isDisplayError ? '0 0 0 4px rgba(220, 38, 38, 0.15)' : '0 0 0 4px rgba(234, 88, 12, 0.15)') : 'none'
                             }}>
                                {isActive && !isDisplayError && <Check size={14} color="#fff" />}
                                {isDisplayError && <X size={14} color="#fff" />}
                            </div>
                            <span style={{ marginTop: '8px', fontSize: '11px', fontWeight: !!isCurrent ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center' }}>
                                {isDisplayError ? currentStatus : step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * RecordViewPanel — right-side slide-over panel for read-only record details.
 *
 * Props:
 *   open        boolean         — whether the panel is visible
 *   onClose     () => void      — called when user clicks X or backdrop
 *   onEdit      () => void      — called when bottom Edit button is clicked
 *   title       string          — panel header title (e.g. "Sale Order Details")
 *   record      object          — the fetched record (full data incl. relations)
 *   fields      [{key, label, render}]  — ordered list of fields to display
 *   sections    [{title, rows}] — optional related-data sections (e.g. line items table)
 *   canEdit     boolean         — whether the Edit button is visible
 */
export default function RecordViewPanel({ open, onClose, onEdit, title, record, fields = [], sections = [], canEdit = true }) {
    if (!open || !record) return null;

    const getValue = (field) => {
        if (field.render) return field.render(record);
        const val = field.key.split('.').reduce((o, k) => o?.[k], record);
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
            return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return String(val);
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            {/* Modal */}
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '520px', maxWidth: '95vw', maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                    {/* Pipeline Progress Bar */}
                    <PipelineBar entityType={title} currentStatus={record.status} />

                    {/* Visual Barcode for Barcode Records */}
                    {(record.barcode || (record.code && record.product?.name)) && (
                        <BarcodeDisplay
                            value={record.barcode || record.code}
                            label={record.product?.name || 'GENERATED BARCODE'}
                            sublabel={record.batchNo ? `Batch: ${record.batchNo}` : null}
                        />
                    )}

                    {/* Main fields */}
                    <div style={{
                        background: 'var(--bg-elevated)', borderRadius: '12px',
                        border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '20px'
                    }}>
                        {fields.map((field, i) => (
                            <div key={field.key} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                padding: '12px 16px', gap: '16px',
                                borderBottom: i < fields.length - 1 ? '1px solid var(--border)' : 'none',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                            }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', minWidth: '140px', flexShrink: 0 }}>
                                    {field.label}
                                </span>
                                <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>
                                    {getValue(field)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Related sections (e.g. line items) */}
                    {sections.map((section) => (
                        <div key={section.title} style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {section.title}
                            </h3>
                            {section.render ? section.render(record) : (
                                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'auto' }}>
                                    <table className="data-table" style={{ minWidth: '100%' }}>
                                        <thead>
                                            <tr>{section.columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {(record[section.dataKey] || []).map((row, ri) => (
                                                <tr key={ri}>
                                                    {section.columns.map(c => (
                                                        <td key={c.key}>
                                                            {c.render ? c.render(row) : (row[c.key] ?? '—')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            {!(record[section.dataKey]?.length) && (
                                                <tr><td colSpan={section.columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No items</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {canEdit && (
                    <div className="modal-footer">
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onEdit}>
                            <Edit size={16} style={{ marginRight: '8px' }} />
                            Edit Record
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
