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

export default function QuotationTemplate({ data }) {
    if (!data) return null;

    const totalQty = data.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 20 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Official Document
                </button>
            </div>

            <div className="print-container">
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

                <div className="print-doc-title">QUOTATION / PROFORMA</div>

                <div className="print-grid-2">
                    <div>
                        <div className="print-box-title">Quoted To</div>
                        <div style={{ fontSize: 13 }}><strong>{data.customer?.name}</strong></div>
                        <div>{data.customer?.address}</div>
                        <div>{data.customer?.city ? `${data.customer.city}, ` : ''}{data.customer?.state} {data.customer?.pincode}</div>
                        {data.customer?.contactPerson && <div><strong>Contact:</strong> {data.customer.contactPerson} ({data.customer?.phone})</div>}
                    </div>

                    <div>
                        <div className="print-box-title">Quotation Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <div><strong>Quote No:</strong></div>
                                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{data.quoteNo}</div>
                                <div style={{ marginTop: 8 }}><strong>Date:</strong></div>
                                <div>{data.quoteDate ? new Date(data.quoteDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                            </div>
                            <div>
                                <div><strong>Valid Until:</strong></div>
                                <div>{data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-IN') : 'N/A'}</div>
                                <div style={{ marginTop: 8 }}><strong>Payment Terms:</strong></div>
                                <div>{data.paymentTerms || 'As per standard policy'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th width="5%" className="center">Sl.</th>
                            <th width="45%">Description of Goods / Services</th>
                            <th width="10%" className="center">HSN/SAC</th>
                            <th width="10%" className="right">Quantity</th>
                            <th width="15%" className="right">Rate (₹)</th>
                            <th width="15%" className="right">Amount (₹)</th>
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
                                <td className="right">{Number(item.total).toFixed(2)}</td>
                            </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 10 - (data.items?.length || 0)) }).map((_, i) => (
                            <tr key={`empty-${i}`} className="empty-row">
                                <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="3" className="right">Sub Total</th>
                            <th className="right">{totalQty}</th>
                            <th></th>
                            <th className="right">₹ {Number(data.totalAmount).toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>

                <div className="print-footer-grid">
                    <div className="print-amount-words">
                        <div style={{ paddingRight: 20 }}>
                            <p style={{ marginTop: 0 }}>We are pleased to submit our most competitive quotation for the items required by you. Please feel free to contact us if you need any clarification.</p>
                        </div>
                    </div>

                    <div className="print-totals">
                        <div className="print-totals-row grand">
                            <span>Quotation Value</span>
                            <span>₹ {Number(data.totalAmount).toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 10, textAlign: 'right', marginTop: 8, paddingRight: 10, color: '#333' }}>
                            * Inclusive of applicable taxes<br />(if not stated otherwise)
                        </div>
                    </div>
                </div>

                <div className="print-declaration-grid">
                    <div className="print-terms">
                        <h4>Commercial Terms & Conditions</h4>
                        <ul>
                            <li><strong>Validity:</strong> Quotation is valid until {data.validUntil ? new Date(data.validUntil).toLocaleDateString() : 'N/A'}.</li>
                            <li><strong>Payment:</strong> {data.paymentTerms || '100% Advance along with Purchase Order'}.</li>
                            <li><strong>Delivery:</strong> Normally within 2-4 weeks upon receipt of confirmed order.</li>
                            <li><strong>Taxes:</strong> Extra as applicable at the time of delivery.</li>
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
