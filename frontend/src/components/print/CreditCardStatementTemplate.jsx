import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

const maskCard = (cardNo) => {
    const text = String(cardNo || '');
    if (text.length < 4) return text || '—';
    return `XXXX XXXX XXXX ${text.slice(-4)}`;
};

export default function CreditCardStatementTemplate({ data }) {
    if (!data) return null;
    const amount = Number(data.amount || 0);
    const processingFee = Number((amount * 0.02).toFixed(2));
    const settlementTotal = amount + processingFee;

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

                <div className="print-doc-title">CREDIT CARD STATEMENT</div>

                <div className="print-grid-2" style={{ marginBottom: 16 }}>
                    <div>
                        <div className="print-box-title">Card Details</div>
                        <div><strong>Card No:</strong> {maskCard(data.cardNo)}</div>
                        <div><strong>Statement Month:</strong> {data.statementMonth || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Transaction Summary</div>
                        <div><strong>Transaction Date:</strong> {formatDate(data.transactionDate)}</div>
                        <div><strong>Merchant:</strong> {data.merchant || '—'}</div>
                        <div><strong>Amount:</strong> {formatCurrency(data.amount)}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Merchant</th>
                            <th>Description</th>
                            <th className="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{formatDate(data.transactionDate)}</td>
                            <td>{data.merchant || '—'}</td>
                            <td>{data.description || '—'}</td>
                            <td className="right">{formatCurrency(amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="3" className="right">Subtotal</th>
                            <th className="right">{formatCurrency(amount)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Processing / Bank Charges (2%)</td>
                                <td className="right">{formatCurrency(processingFee)}</td>
                            </tr>
                            <tr>
                                <td>Total Settlement Amount</td>
                                <td className="right">{formatCurrency(settlementTotal)}</td>
                            </tr>
                            <tr>
                                <td>Amount in Words</td>
                                <td className="right">{amountInWords(settlementTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Payment Notes</h4>
                        <ul>
                            <li>Please verify statement entries before posting to expense ledgers.</li>
                            <li>Keep this document for audit and reconciliation references.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Accounts / Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
