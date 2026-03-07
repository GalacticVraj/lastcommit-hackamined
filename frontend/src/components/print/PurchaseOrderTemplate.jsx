import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate } from './companyInfo';

export default function PurchaseOrderTemplate({ data }) {
    if (!data) return null;
    const items = data.items || [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
    const taxAmount = items.reduce((sum, item) => {
        const lineBase = Number(item.quantity || 0) * Number(item.rate || 0);
        const gstPercent = Number(item.gstPercent || 0);
        return sum + ((lineBase * gstPercent) / 100);
    }, 0);
    const computedGrandTotal = subtotal + taxAmount;

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print PO
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

                <div className="print-doc-title">PURCHASE ORDER</div>

                <div className="print-grid-2" style={{ marginBottom: 12 }}>
                    <div>
                        <div className="print-box-title">Vendor Details</div>
                        <div><strong>{data.vendor?.name || '—'}</strong></div>
                        <div>{data.vendor?.address || '—'}</div>
                        <div>{[data.vendor?.city, data.vendor?.state].filter(Boolean).join(', ')}</div>
                        <div><strong>GSTIN:</strong> {data.vendor?.gstin || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">PO Details</div>
                        <div><strong>PO No:</strong> {data.poNo || '—'}</div>
                        <div><strong>PO Date:</strong> {formatDate(data.poDate || data.createdAt)}</div>
                        <div><strong>Expected Delivery:</strong> {formatDate(data.expectedDelivery)}</div>
                        <div><strong>Status:</strong> {data.status || 'Pending'}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="right">Qty</th>
                            <th className="right">Rate</th>
                            <th className="right">GST %</th>
                            <th className="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length ? items.map((item, idx) => (
                            <tr key={item.id || idx}>
                                <td>{item.productName || `Product #${item.productId || '—'}`}</td>
                                <td className="right">{Number(item.quantity || 0).toFixed(2)}</td>
                                <td className="right">{formatCurrency(item.rate)}</td>
                                <td className="right">{Number(item.gstPercent || 0).toFixed(2)}%</td>
                                <td className="right">{formatCurrency(item.total)}</td>
                            </tr>
                        )) : <tr><td colSpan="5" className="center">No line items</td></tr>}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="4" className="right">Subtotal (Before Tax)</th>
                            <th className="right">{formatCurrency(subtotal)}</th>
                        </tr>
                        <tr>
                            <th colSpan="4" className="right">Total GST</th>
                            <th className="right">{formatCurrency(taxAmount)}</th>
                        </tr>
                        <tr>
                            <th colSpan="4" className="right">Grand Total</th>
                            <th className="right">{formatCurrency(data.totalAmount || computedGrandTotal)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div className="print-declaration-grid" style={{ marginTop: 26 }}>
                    <div className="print-terms">
                        <h4>Terms</h4>
                        <ul>
                            <li>Deliver as per PO terms and quality standards.</li>
                            <li>Invoice and e-way documents to be attached if applicable.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Purchase Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
