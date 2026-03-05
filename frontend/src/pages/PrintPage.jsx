import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../lib/api';
import '../components/print/PrintPage.css';
import InvoiceTemplate from '../components/print/InvoiceTemplate';
import QuotationTemplate from '../components/print/QuotationTemplate';

export default function PrintPage() {
    const { type, id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                let endpoint = '';
                if (type === 'invoice') endpoint = `/sales/invoices/${id}`;
                else if (type === 'quotation') endpoint = `/sales/quotations/${id}`;
                // Add more document endpoints here...
                else throw new Error('Invalid print document type');

                const res = await api.get(endpoint);
                setData(res.data.data);

                // Allow network images to load, then trigger print dialog
                setTimeout(() => {
                    window.print();
                }, 800);
            } catch (err) {
                console.error(err);
                setError('Failed to load document for printing');
            } finally {
                setLoading(false);
            }
        };

        if (id) loadData();
    }, [type, id]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading document...</div>;
    if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>;
    if (!data) return <Navigate to="/" />;

    // Render the appropriate template
    return (
        <div className="print-container">
            {type === 'invoice' && <InvoiceTemplate data={data} />}
            {type === 'quotation' && <QuotationTemplate data={data} />}
        </div>
    );
}
