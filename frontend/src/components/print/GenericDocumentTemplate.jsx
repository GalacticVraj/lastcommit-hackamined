import { Printer } from 'lucide-react';
import { TECHMICRA_INFO, formatDate } from './companyInfo';

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return Number(value).toLocaleString('en-IN');
    if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)) return formatDate(value);
    return String(value);
};

export default function GenericDocumentTemplate({ title, data, fields = [] }) {
    if (!data) return null;

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 20 }} className="screen-only">
                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} style={{ marginRight: 8 }} /> Print Document
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

                <table className="print-table">
                    <tbody>
                        {fields.map((field) => (
                            <tr key={field.key}>
                                <td style={{ width: '35%', fontWeight: 600 }}>{field.label}</td>
                                <td>{formatValue(data[field.key])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="print-declaration-grid" style={{ marginTop: 30 }}>
                    <div className="print-terms">
                        <h4>Notes</h4>
                        <ul>
                            <li>System generated document.</li>
                            <li>Please verify all details before processing.</li>
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
