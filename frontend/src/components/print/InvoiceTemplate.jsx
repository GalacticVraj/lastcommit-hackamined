import React from 'react';
import { Printer } from 'lucide-react';

const TECHMICRA_INFO = {
    name: 'TechMicra IT Solutions',
    addressLine1: '408, 4th Floor, Ashwamegh Elegance III,',
    addressLine2: 'Nr. CN Vidhyalay, opp. SBI Zonal office,',
    cityStatePin: 'Ambawadi, Ahmedabad, Gujarat 380015',
    email: 'pallav@techmicra.in',
    phone: '9727835207',
    gstin: '24AAACT1234A1Z5'
};

export default function InvoiceTemplate({ data }) {
    if (!data) return null;

    // Calculate total qty
    const totalQty = data.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

    const numberToWords = (num) => {
        return `Rupees ${Number(num).toLocaleString('en-IN')} Only`;
    };

    return (
        <div>
            {/* Screen Actions (hidden when printed) */}
            <div style={{ textAlign: 'right', marginBottom: 20 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Official Document
                </button>
            </div>

            <div className="print-container">
                {/* Header */}
                <div className="print-header">
                    <div className="print-logo-container">
                        <img src="/techmicra-logo.png" alt="TechMicra Logo" className="print-logo" />
                    </div>
                    <div className="print-company-info">
                        <h2 className="print-company-name">{TECHMICRA_INFO.name}</h2>
                        <div className="print-company-details">
                            <div>{TECHMICRA_INFO.addressLine1} {TECHMICRA_INFO.addressLine2}</div>
                            <div>{TECHMICRA_INFO.cityStatePin}</div>
                            <div style={{ marginTop: 4 }}><strong>Email:</strong> {TECHMICRA_INFO.email} | <strong>Phone:</strong> +91 {TECHMICRA_INFO.phone}</div>
                            <div style={{ marginTop: 4 }}><strong>GSTIN/UIN:</strong> {TECHMICRA_INFO.gstin}</div>
                        </div>
                    </div>
                </div>

                <div className="print-doc-title">TAX INVOICE</div>

                {/* Party Details */}
                <div className="print-grid-2">
                    <div>
                        <div className="print-box-title">Billed To (Customer)</div>
                        <div style={{ fontSize: 13 }}><strong>{data.customer?.name}</strong></div>
                        <div>{data.customer?.address}</div>
                        <div>{data.customer?.city ? `${data.customer.city}, ` : ''}{data.customer?.state} {data.customer?.pincode}</div>
                        {data.customer?.contactPerson && <div><strong>Contact:</strong> {data.customer.contactPerson} ({data.customer?.phone})</div>}
                        <div style={{ marginTop: 8 }}><strong>GSTIN/UIN:</strong> {data.customer?.gstin || 'URP'}</div>
                        <div><strong>State Code:</strong> {data.customer?.stateCode || '24'}</div>
                    </div>

                    <div>
                        <div className="print-box-title">Invoice Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <div><strong>Invoice No:</strong></div>
                                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{data.invoiceNo}</div>
                                <div style={{ marginTop: 8 }}><strong>Invoice Date:</strong></div>
                                <div>{data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                            </div>
                            <div>
                                <div><strong>Place of Supply:</strong></div>
                                <div>{data.placeOfSupply || data.customer?.state || 'Gujarat'}</div>
                                <div style={{ marginTop: 8 }}><strong>E-Way Bill No:</strong></div>
                                <div>{data.ewayBillNo || 'Not Applicable'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Item Table */}
                <table className="print-table">
                    <thead>
                        <tr>
                            <th width="5%" className="center">Sl.</th>
                            <th width="35%">Description of Goods / Services</th>
                            <th width="10%" className="center">HSN/SAC</th>
                            <th width="10%" className="right">Quantity</th>
                            <th width="10%" className="right">Rate (₹)</th>
                            <th width="10%" className="right">GST %</th>
                            <th width="20%" className="right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items?.map((item, idx) => (
                            <tr key={item.id}>
                                <td className="center">{idx + 1}</td>
                                <td><strong>{item.product?.name || `Product ID ${item.productId}`}</strong></td>
                                <td className="center">{item.product?.hsnCode || '—'}</td>
                                <td className="right">{item.quantity} {item.product?.unit || 'NOS'}</td>
                                <td className="right">{Number(item.rate).toFixed(2)}</td>
                                <td className="right">{item.gstPercent}%</td>
                                <td className="right">{Number(item.total - item.cgst - item.sgst - item.igst).toFixed(2)}</td>
                            </tr>
                        ))}
                        {/* Empty rows to push footer down */}
                        {Array.from({ length: Math.max(0, 10 - (data.items?.length || 0)) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="empty-row">
                                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="3" className="right">Total</th>
                            <th className="right">{totalQty}</th>
                            <th colSpan="2"></th>
                            <th className="right">₹ {Number(data.taxableValue).toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>

                {/* Calculations & Summary Grid */}
                <div className="print-footer-grid">
                    <div className="print-amount-words">
                        <div style={{ marginBottom: 15 }}>
                            <strong>Amount Chargeable (in words):</strong><br />
                            <i>{numberToWords(data.grandTotal)}</i>
                        </div>

                        <div className="print-box-title">Bank Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4 }}>
                            <strong>Bank Name:</strong> <span>State Bank of India</span>
                            <strong>A/c No:</strong> <span>000000123456789</span>
                            <strong>Branch & IFSC:</strong> <span>Ambawadi / SBIN0001234</span>
                        </div>
                    </div>

                    <div className="print-totals">
                        <div className="print-totals-row">
                            <span>Total Taxable Value</span>
                            <span>₹ {Number(data.taxableValue).toFixed(2)}</span>
                        </div>
                        {data.cgstAmount > 0 && (
                            <div className="print-totals-row">
                                <span>Add: CGST @ {(data.items?.[0]?.gstPercent || 18) / 2}%</span>
                                <span>₹ {Number(data.cgstAmount).toFixed(2)}</span>
                            </div>
                        )}
                        {data.sgstAmount > 0 && (
                            <div className="print-totals-row">
                                <span>Add: SGST @ {(data.items?.[0]?.gstPercent || 18) / 2}%</span>
                                <span>₹ {Number(data.sgstAmount).toFixed(2)}</span>
                            </div>
                        )}
                        {data.igstAmount > 0 && (
                            <div className="print-totals-row">
                                <span>Add: IGST @ {data.items?.[0]?.gstPercent || 18}%</span>
                                <span>₹ {Number(data.igstAmount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="print-totals-row">
                            <span>Round Off</span>
                            <span>₹ {Number(data.roundOff || 0).toFixed(2)}</span>
                        </div>
                        <div className="print-totals-row grand">
                            <span>Grand Total</span>
                            <span>₹ {Number(data.grandTotal).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Terms and Signature Grid */}
                <div className="print-declaration-grid">
                    <div className="print-terms">
                        <h4>Declaration</h4>
                        <div style={{ marginBottom: 15 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>

                        <h4>Terms & Conditions</h4>
                        <ul>
                            <li>Subject to Ahmedabad jurisdiction only.</li>
                            <li>Goods/Services once sold will not be taken back.</li>
                            <li>Interest @ 18% p.a. will be charged if payment is delayed beyond 15 days.</li>
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
