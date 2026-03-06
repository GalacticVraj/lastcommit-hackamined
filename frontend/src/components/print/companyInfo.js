export const TECHMICRA_INFO = {
    name: 'TechMicra IT Solutions',
    address: '408, 4th Floor, Ashwamegh Elegance III, Nr. CN Vidhyalay, opp. SBI Zonal office, Ambawadi, Ahmedabad, Gujarat 380015',
    email: 'info@techmicra.co.in',
    phone: '070437 86365',
    logoPath: '/techmicra-logo.png'
};

export const formatCurrency = (value) => `₹ ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN');
};

export const amountInWords = (value) => {
    const amount = Number(value || 0);
    return `Rupees ${amount.toLocaleString('en-IN')} Only`;
};

export const formatNumber = (value, digits = 2) => Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
});

export const safeDividePercent = (numerator, denominator) => {
    const num = Number(numerator || 0);
    const den = Number(denominator || 0);
    if (!den) return '0.00%';
    return `${((num / den) * 100).toFixed(2)}%`;
};
