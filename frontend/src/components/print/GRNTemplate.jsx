import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatDate, formatNumber, safeDividePercent } from './companyInfo';

export default function GRNTemplate({ data }) {
    if (!data) return null;
    const items = data.items || [];
    const totalReceived = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalAccepted = items.reduce((sum, item) => sum + Number(item.acceptedQty || 0), 0);
    const totalRejected = items.reduce((sum, item) => sum + Number(item.rejectedQty || 0), 0);

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print GRN
                </button>
            </div>

            <div className="print-container">
                <div className="print-header">
                    <div className="print-logo-container"><img src={TECHMICRA_INFO.logoPath} alt="TechMicra Logo" className="print-logo" /></div>
                    <div className="print-company-info">
                        <h2 className="print-company-name">{TECHMICRA_INFO.name}</h2>
                        <div className="print-company-details">
                            <div>{TECHMICRA_INFO.address}</div>
                            <div><strong>Email:</strong> {TECHMICRA_INFO.email} | <strong>Phone:</strong> +91 {TECHMICRA_INFO.phone}</div>
                        </div>
                    </div>
                </div>

                <div className="print-doc-title">GOODS RECEIPT NOTE (GRN)</div>

                <div className="print-grid-2" style={{ marginBottom: 12 }}>
                    <div>
                        <div className="print-box-title">Supplier</div>
                        <div><strong>{data.vendor?.name || '—'}</strong></div>
                        <div>{data.vendor?.address || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">GRN Details</div>
                        <div><strong>GRN No:</strong> {data.grnNo || '—'}</div>
                        <div><strong>GRN Date:</strong> {formatDate(data.grnDate || data.createdAt)}</div>
                        <div><strong>Challan No:</strong> {data.challanNo || '—'}</div>
                        <div><strong>Status:</strong> {data.status || 'Pending'}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="right">Received Qty</th>
                            <th className="right">Accepted Qty</th>
                            <th className="right">Rejected Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length ? items.map((item, idx) => (
                            <tr key={item.id || idx}>
                                <td>{item.productName || `Product #${item.productId || '—'}`}</td>
                                <td className="right">{Number(item.quantity || 0).toFixed(2)}</td>
                                <td className="right">{Number(item.acceptedQty || 0).toFixed(2)}</td>
                                <td className="right">{Number(item.rejectedQty || 0).toFixed(2)}</td>
                            </tr>
                        )) : <tr><td colSpan="4" className="center">No GRN items</td></tr>}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total</th>
                            <th className="right">{formatNumber(totalReceived)}</th>
                            <th className="right">{formatNumber(totalAccepted)}</th>
                            <th className="right">{formatNumber(totalRejected)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Acceptance Ratio</td>
                                <td className="right">{safeDividePercent(totalAccepted, totalReceived)}</td>
                            </tr>
                            <tr>
                                <td>Rejection Ratio</td>
                                <td className="right">{safeDividePercent(totalRejected, totalReceived)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 26 }}>
                    <div className="print-terms">
                        <h4>Receiving Note</h4>
                        <ul>
                            <li>Material verified against PO and challan details.</li>
                            <li>Quality acceptance is subject to QC confirmation.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Store / QC Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
