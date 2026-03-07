import React from 'react';
import Barcode from 'react-barcode';

const BarcodeDisplay = ({ value, label, sublabel }) => {
    if (!value) return null;

    return (
        <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '300px',
            margin: '10px auto',
            color: '#1a1a1a'
        }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#666' }}>
                {label || 'BARCODE'}
            </h4>
            <div style={{
                background: '#f8fafc',
                padding: '10px',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1'
            }}>
                <Barcode
                    value={value}
                    width={1.5}
                    height={60}
                    fontSize={12}
                    background="transparent"
                />
            </div>
            {sublabel && (
                <p style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                    {sublabel}
                </p>
            )}
        </div>
    );
};

export default BarcodeDisplay;
