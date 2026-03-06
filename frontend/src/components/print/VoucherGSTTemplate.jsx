import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

export default function VoucherGSTTemplate({ data }) {
    if (!data) return null;
    const amount = Number(data.amount || 0);
    const taxDirection = data.gstLedger === 'Input' ? 'Input Tax Credit' : 'Output Tax Liability';

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

                <div className="print-doc-title">GST ADJUSTMENT VOUCHER</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Voucher Details</div>
                        <div><strong>Voucher No:</strong> {data.voucherNo || '—'}</div>
                        <div><strong>Date:</strong> {formatDate(data.date)}</div>
                        <div><strong>GST Ledger:</strong> {data.gstLedger || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Adjustment Details</div>
                        <div><strong>Adjustment Type:</strong> {data.adjustmentType || '—'}</div>
                        <div><strong>Amount:</strong> {formatCurrency(data.amount)}</div>
                        <div><strong>In Words:</strong> {amountInWords(data.amount)}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Particular</th>
                            <th>Ledger</th>
                            <th>Adjustment Type</th>
                            <th className="right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>GST Adjustment Entry</td>
                            <td>{taxDirection}</td>
                            <td>{data.adjustmentType || '—'}</td>
                            <td className="right">{formatCurrency(amount)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Tax Impact</td>
                                <td className="right">{data.gstLedger === 'Input' ? 'Increases ITC' : 'Increases Payable'}</td>
                            </tr>
                            <tr>
                                <td>Amount in Words</td>
                                <td className="right">{amountInWords(amount)}</td>
                            </tr>
                            <tr>
                                <td>Remarks</td>
                                <td className="right">{data.remarks || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Tax Declaration</h4>
                        <ul>
                            <li>This voucher has been posted in compliance with GST records.</li>
                            <li>All tax adjustments are subject to statutory verification.</li>
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
