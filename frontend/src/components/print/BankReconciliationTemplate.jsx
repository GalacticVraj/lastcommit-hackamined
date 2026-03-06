import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, safeDividePercent } from './companyInfo';

export default function BankReconciliationTemplate({ data }) {
    if (!data) return null;

    const systemBalance = Number(data.systemBalance || 0);
    const bankBalance = Number(data.bankBalance || 0);
    const unreconciledAmt = Number(data.unreconciledAmt || Math.abs(bankBalance - systemBalance));
    const reconciledAmt = Math.max(systemBalance, bankBalance) - unreconciledAmt;

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 20 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Statement
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

                <div className="print-doc-title">BANK RECONCILIATION STATEMENT</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Bank Details</div>
                        <div><strong>Bank Account:</strong> {data.bankAccount || '—'}</div>
                        <div><strong>Statement Date:</strong> {formatDate(data.statementDate)}</div>
                        <div><strong>Status:</strong> {data.status || 'Pending'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Balance Summary</div>
                        <div><strong>System Balance:</strong> {formatCurrency(systemBalance)}</div>
                        <div><strong>Bank Balance:</strong> {formatCurrency(bankBalance)}</div>
                        <div><strong>Unreconciled Amount:</strong> {formatCurrency(unreconciledAmt)}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Particular</th>
                            <th className="right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>System Closing Balance</td>
                            <td className="right">{formatCurrency(systemBalance)}</td>
                        </tr>
                        <tr>
                            <td>Bank Statement Balance</td>
                            <td className="right">{formatCurrency(bankBalance)}</td>
                        </tr>
                        <tr>
                            <td>Difference / Unreconciled</td>
                            <td className="right">{formatCurrency(unreconciledAmt)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Reconciled Amount</td>
                                <td className="right">{formatCurrency(reconciledAmt)}</td>
                            </tr>
                            <tr>
                                <td>Reconciliation Accuracy</td>
                                <td className="right">{safeDividePercent(reconciledAmt, Math.max(systemBalance, bankBalance))}</td>
                            </tr>
                            <tr>
                                <td>Variance %</td>
                                <td className="right">{safeDividePercent(unreconciledAmt, Math.max(systemBalance, bankBalance))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Notes</h4>
                        <ul>
                            <li>Prepared based on available ledger and bank statement entries.</li>
                            <li>All unreconciled differences must be reviewed and closed.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Prepared By / Verified By</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
