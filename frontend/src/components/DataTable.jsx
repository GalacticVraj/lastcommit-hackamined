import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import EmptyState from './EmptyState';

/**
 * DataTable — full-featured data table with:
 *   - Skeleton loading
 *   - Debounced search (300ms)
 *   - Column sorting (click header)
 *   - Pagination (prev/next/page numbers)
 *   - CSV export of current filtered data
 *   - Row count display
 *   - Empty state
 *
 * Props:
 *   data         any[]           — all rows (client-side mode) or current page rows (server-side)
 *   columns      [{key, label, render?, sortable?}]
 *   loading      boolean
 *   total        number          — total record count (for server-side pagination)
 *   page         number          — current page (1-indexed)
 *   perPage      number          — page size
 *   onPageChange (page) => void
 *   onSearch     (q) => void     — called after 300ms debounce
 *   onSort       (col, dir) => void
 *   onNew        () => void      — if provided, shows New button in empty state
 *   emptyTitle   string
 *   emptyMessage string
 *   moduleName   string          — for CSV file name
 *   actions      (row) => ReactNode  — renders action buttons per row
 *   searchValue  string          — controlled search value
 */
export default function DataTable({
    data = [], columns = [], loading = false,
    total = 0, page = 1, perPage = 25,
    onPageChange, onSearch, onSort,
    onNew, emptyTitle, emptyMessage, moduleName = 'export',
    actions, searchValue = ''
}) {
    const [search, setSearch] = useState(searchValue);
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const debounceTimer = useRef(null);

    // Debounced search
    const handleSearch = useCallback((val) => {
        setSearch(val);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            onSearch?.(val);
        }, 300);
    }, [onSearch]);

    // Column sort
    const handleSort = (col) => {
        if (!col.sortable) return;
        const newDir = sortCol === col.key && sortDir === 'asc' ? 'desc' : 'asc';
        setSortCol(col.key);
        setSortDir(newDir);
        onSort?.(col.key, newDir);
    };

    // CSV Export
    const exportCSV = () => {
        const headers = columns.map(c => c.label).join(',');
        const rows = data.map(row =>
            columns.map(c => {
                const val = c.key.split('.').reduce((o, k) => o?.[k], row);
                return `"${String(val ?? '').replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${moduleName}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = total === 0 ? 0 : (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    // Page number array (show max 5 pages around current)
    const pageNums = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
        pageNums.push(i);
    }

    return (
        <div className="table-container">
            {/* Toolbar */}
            <div className="table-toolbar" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="table-search"
                        style={{ paddingLeft: '32px', width: '100%' }}
                        placeholder="Search…"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
                    {total > 0 && (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            Showing {start}–{end} of {total} records
                        </span>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={exportCSV} title="Export CSV" style={{ gap: '6px' }}>
                        <Download size={14} /> CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '600px' }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key}
                                    onClick={() => handleSort(col)}
                                    style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {col.label}
                                        {col.sortable && (
                                            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 0 }}>
                                                <ChevronUp size={10} style={{ opacity: sortCol === col.key && sortDir === 'asc' ? 1 : 0.3 }} />
                                                <ChevronDown size={10} style={{ opacity: sortCol === col.key && sortDir === 'desc' ? 1 : 0.3 }} />
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {columns.map((_, j) => (
                                        <td key={j}><div className="skeleton" style={{ height: '16px', width: `${60 + Math.random() * 30}%`, borderRadius: '4px' }} /></td>
                                    ))}
                                    {actions && <td><div className="skeleton" style={{ height: '16px', width: '80px' }} /></td>}
                                </tr>
                            ))
                            : data.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: 0, border: 'none' }}>
                                            <EmptyState
                                                title={emptyTitle || 'No records found'}
                                                message={emptyMessage || 'Try adjusting your search or create a new record.'}
                                                onNew={onNew}
                                            />
                                        </td>
                                    </tr>
                                )
                                : data.map((row, ri) => (
                                    <tr key={row.id ?? ri}>
                                        {columns.map(col => (
                                            <td key={col.key}>
                                                {col.render
                                                    ? col.render(row)
                                                    : (() => {
                                                        const val = col.key.split('.').reduce((o, k) => o?.[k], row);
                                                        return val ?? '—';
                                                    })()
                                                }
                                            </td>
                                        ))}
                                        {actions && <td>{actions(row)}</td>}
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && total > perPage && (
                <div className="table-pagination">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Page {page} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}
                            onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}>
                            <ChevronLeft size={14} />
                        </button>
                        {pageNums[0] > 1 && (
                            <><button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }} onClick={() => onPageChange?.(1)}>1</button>
                                {pageNums[0] > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}</>
                        )}
                        {pageNums.map(n => (
                            <button key={n}
                                className={`btn btn-sm ${n === page ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ padding: '4px 10px', minWidth: '32px' }}
                                onClick={() => onPageChange?.(n)}>
                                {n}
                            </button>
                        ))}
                        {pageNums[pageNums.length - 1] < totalPages && (
                            <>{pageNums[pageNums.length - 1] < totalPages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px' }} onClick={() => onPageChange?.(totalPages)}>{totalPages}</button></>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}
                            onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
