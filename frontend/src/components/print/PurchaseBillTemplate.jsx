import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatCurrency, formatDate, amountInWords } from './companyInfo';

export default function PurchaseBillTemplate({ data }) {
    if (!data) return null;
    const taxableValue = Number(data.taxableValue || 0);
    const cgstAmount = Number(data.cgstAmount || 0);
    const sgstAmount = Number(data.sgstAmount || 0);
    const igstAmount = Number(data.igstAmount || 0);
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const netPayable = Number(data.grandTotal || taxableValue + totalTax);

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 16 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Bill
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

                <div className="print-doc-title">PURCHASE BILL</div>

                <div className="print-grid-2" style={{ marginBottom: 12 }}>
                    <div>
                        <div className="print-box-title">Vendor</div>
                        <div><strong>{data.vendor?.name || '—'}</strong></div>
                        <div>{data.vendor?.address || '—'}</div>
                        <div><strong>GSTIN:</strong> {data.vendor?.gstin || '—'}</div>
                    </div>
                    <div>
                        <div className="print-box-title">Bill Details</div>
                        <div><strong>Bill No:</strong> {data.billNo || '—'}</div>
                        <div><strong>Vendor Invoice No:</strong> {data.vendorInvoiceNo || '—'}</div>
                        <div><strong>Bill Date:</strong> {formatDate(data.billDate || data.createdAt)}</div>
                        <div><strong>Due Date:</strong> {formatDate(data.dueDate)}</div>
                        <div><strong>Status:</strong> {data.status || 'Unpaid'}</div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Taxable Value</th>
                            <th className="right">CGST</th>
                            <th className="right">SGST</th>
                            <th className="right">IGST</th>
                            <th className="right">Grand Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{formatCurrency(taxableValue)}</td>
                            <td className="right">{formatCurrency(cgstAmount)}</td>
                            <td className="right">{formatCurrency(sgstAmount)}</td>
                            <td className="right">{formatCurrency(igstAmount)}</td>
                            <td className="right">{formatCurrency(netPayable)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ marginTop: 10 }}>
                    <table className="print-table">
                        <tbody>
                            <tr>
                                <td>Total Tax</td>
                                <td className="right">{formatCurrency(totalTax)}</td>
                            </tr>
                            <tr>
                                <td>Net Payable</td>
                                <td className="right">{formatCurrency(netPayable)}</td>
                            </tr>
                            <tr>
                                <td>Amount in Words</td>
                                <td className="right">{amountInWords(netPayable)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="print-declaration-grid" style={{ marginTop: 26 }}>
                    <div className="print-terms">
                        <h4>Accounts Note</h4>
                        <ul>
                            <li>Bill posted as per supporting purchase records.</li>
                            <li>Payment release subject to approval workflow.</li>
                        </ul>
                    </div>
                    <div className="print-sign-box">
                        <strong>For {TECHMICRA_INFO.name}</strong>
                        <div className="print-sign-line">Accounts Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
