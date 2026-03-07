import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

export default function SalesReceiptTemplate({ data }) {
    if (!data) return null;

    const receiptNo = data.receiptNo || data.receipt_no || '—';
    const receiptDate = data.receiptDate || data.receipt_date || data.createdAt;
    const paymentMode = data.paymentMode || data.payment_mode || 'Cash';
    const amount = Number(data.amount || 0);
    const invoiceTotal = Number(data.invoice?.grandTotal || 0);
    const pendingAmount = Math.max(invoiceTotal - amount, 0);

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Receipt
                </button>
            </div>

            <div className="print-container">
                <div className="print-header">
                    <div className="print-logo-container">
                        <img src={TECHMICRA_INFO.logoPath} alt="TechMicra Logo" className="print-logo" />
                    </div>
                    <div className="print-company-info">
                        <h2 className="print-company-name">{TECHMICRA_INFO.name}</h2>
                        <div className="print-company-details">
                            <div>{TECHMICRA_INFO.address}</div>
                            <div><strong>Email:</strong> {TECHMICRA_INFO.email} | <strong>Phone:</strong> +91 {TECHMICRA_INFO.phone}</div>
                        </div>
                    </div>
                </div>

                <div className="print-doc-title">RECEIPT VOUCHER</div>

                <div className="print-grid-2" style={{ marginBottom: 12 }}>
                    <div>
                        <div className="print-box-title">Receipt Info</div>
                        <div><strong>Receipt No:</strong> {receiptNo}</div>
                        <div><strong>Receipt Date:</strong> {formatDate(receiptDate)}</div>
                        <div><strong>Payment Mode:</strong> {paymentMode}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Received From</div>
                        <div><strong>Customer:</strong> {data.customer?.name || '—'}</div>
                        <div>{data.customer?.address || '—'}</div>
                        <div>{[data.customer?.city, data.customer?.state].filter(Boolean).join(', ')}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Particular</th>
                            <th>Reference</th>
                            <th className="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Receipt against invoice/payment</td>
                            <td>{data.invoice?.invoiceNo || data.invoiceId || 'General Receipt'}</td>
                            <td className="right">{formatCurrency(amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="2" className="right">Total Received</th>
                            <th className="right">{formatCurrency(amount)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Invoice Total</td>
                                <td className="right">{formatCurrency(invoiceTotal)}</td>
                            </tr>
                            <tr>
                                <td>Amount Received</td>
                                <td className="right">{formatCurrency(amount)}</td>
                            </tr>
                            <tr>
                                <td>Outstanding Balance</td>
                                <td className="right">{formatCurrency(pendingAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 12 }}>
                    <strong>Amount in Words:</strong> {amountInWords(amount)}
                </div>
                <div style={{ marginTop: 8 }}>
                    <strong>Remarks:</strong> {data.remarks || '—'}
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 26 }}>
                    <div className="print-terms">
                        <h4>Declaration</h4>
                        <ul>
                            <li>Received with thanks and accounted in books.</li>
                            <li>Subject to realization and verification.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
