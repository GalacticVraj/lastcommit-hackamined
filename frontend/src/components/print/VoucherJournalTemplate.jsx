import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords, formatNumber } from './companyInfo';

export default function VoucherJournalTemplate({ data }) {
    if (!data) return null;

    const amount = Number(data.amount || 0);

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

                <div className="print-doc-title">VOUCHER JOURNAL</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Voucher Details</div>
                        <div><strong>Journal No:</strong> {data.journalNo || '—'}</div>
                        <div><strong>Date:</strong> {formatDate(data.date)}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Amount</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{formatCurrency(data.amount)}</div>
                        <div><strong>In Words:</strong> {amountInWords(data.amount)}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th className="center">#</th>
                            <th>Particular</th>
                            <th>Account</th>
                            <th className="right">Debit (₹)</th>
                            <th className="right">Credit (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="center">1</td>
                            <td>Debit</td>
                            <td>{data.debitAccount || '—'}</td>
                            <td className="right">{formatCurrency(data.amount)}</td>
                            <td className="right">—</td>
                        </tr>
                        <tr>
                            <td className="center">2</td>
                            <td>Credit</td>
                            <td>{data.creditAccount || '—'}</td>
                            <td className="right">—</td>
                            <td className="right">{formatCurrency(data.amount)}</td>
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

                <div style={{ marginTop: 12 }}>
                    <div className="print-box-title">Posting Particulars</div>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Amount in Figures</td>
                                <td className="right">{formatCurrency(amount)}</td>
                            </tr>
                            <tr>
                                <td>Amount in Words</td>
                                <td className="right">{amountInWords(amount)}</td>
                            </tr>
                            <tr>
                                <td>Balance Check</td>
                                <td className="right">{formatNumber(amount - amount)} (Balanced)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: 14 }}>
                    <div className="print-box-title">Narration</div>
                    <div style={{ minHeight: 60 }}>{data.narration || '—'}</div>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Approval</h4>
                        <ul>
                            <li>Prepared By: ____________________</li>
                            <li>Checked By: ____________________</li>
                            <li>Approved By: ____________________</li>
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
