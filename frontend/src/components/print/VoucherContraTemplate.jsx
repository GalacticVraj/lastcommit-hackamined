import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

export default function VoucherContraTemplate({ data }) {
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

                <div className="print-doc-title">CONTRA VOUCHER</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Voucher Details</div>
                        <div><strong>Voucher No:</strong> {data.voucherNo || '—'}</div>
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
                            <th>Transfer Type</th>
                            <th>Account</th>
                            <th className="right">Debit (₹)</th>
                            <th className="right">Credit (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="center">1</td>
                            <td>From</td>
                            <td>{data.fromAccount || '—'}</td>
                            <td className="right">—</td>
                            <td className="right">{formatCurrency(amount)}</td>
                        </tr>
                        <tr>
                            <td className="center">2</td>
                            <td>To</td>
                            <td>{data.toAccount || '—'}</td>
                            <td className="right">{formatCurrency(amount)}</td>
                            <td className="right">—</td>
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

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Transfer Amount in Words</td>
                                <td className="right">{amountInWords(amount)}</td>
                            </tr>
                            <tr>
                                <td>Narration / Purpose</td>
                                <td className="right">{data.remarks || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Verification</h4>
                        <ul>
                            <li>Cash/Bank movement verified with source entries.</li>
                            <li>Subject to internal controls and audit.</li>
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
