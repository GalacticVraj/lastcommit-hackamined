import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

export default function VoucherPaymentReceiptTemplate({ data }) {
    if (!data) return null;
    const title = data.voucherType === 'Receipt' ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';
    const amount = Number(data.amount || 0);
    const accountingHead = data.voucherType === 'Receipt' ? 'Cash/Bank A/c' : 'Party A/c';
    const counterHead = data.voucherType === 'Receipt' ? 'Party A/c' : 'Cash/Bank A/c';

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 20 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Voucher
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

                <div className="print-doc-title">{title}</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Voucher Details</div>
                        <div><strong>Voucher No:</strong> {data.voucherNo || '—'}</div>
                        <div><strong>Date:</strong> {formatDate(data.date)}</div>
                        <div><strong>Mode:</strong> {data.mode || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Party & Amount</div>
                        <div><strong>Party Name:</strong> {data.partyName || '—'}</div>
                        <div><strong>Amount:</strong> {formatCurrency(data.amount)}</div>
                        <div><strong>Reference No:</strong> {data.referenceNo || '—'}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th className="center">#</th>
                            <th>Particular</th>
                            <th>Ledger Head</th>
                            <th className="right">Debit (₹)</th>
                            <th className="right">Credit (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="center">1</td>
                            <td>{title}</td>
                            <td>{accountingHead}</td>
                            <td className="right">{formatCurrency(amount)}</td>
                            <td className="right">—</td>
                        </tr>
                        <tr>
                            <td className="center">2</td>
                            <td>Against {data.partyName || 'Party'}</td>
                            <td>{counterHead}</td>
                            <td className="right">—</td>
                            <td className="right">{formatCurrency(amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="3" className="right">Total</th>
                            <th className="right">{formatCurrency(amount)}</th>
                            <th className="right">{formatCurrency(amount)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div className="print-footer-grid" style={{ marginTop: 8 }}>
                    <div className="print-amount-words">
                        <strong>Amount in Words:</strong>
                        <div>{amountInWords(data.amount)}</div>
                        <div style={{ marginTop: 16 }}>
                            <strong>Remarks:</strong>
                            <div>{data.remarks || '—'}</div>
                        </div>
                    </div>
                    <div className="print-totals">
                        <div className="print-totals-row">
                            <span>Base Amount</span>
                            <span>{formatCurrency(amount)}</span>
                        </div>
                        <div className="print-totals-row">
                            <span>Round Off</span>
                            <span>{formatCurrency(0)}</span>
                        </div>
                        <div className="print-totals-row grand">
                            <span>Total</span>
                            <span>{formatCurrency(amount)}</span>
                        </div>
                    </div>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Acknowledgement</h4>
                        <ul>
                            <li>Received/Paid against proper authority and records.</li>
                            <li>Subject to audit and verification.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Cashier / Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
