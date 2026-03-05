/**
 * GST Calculator
 * CGST + SGST for intrastate, IGST for interstate
 * Comparison based on first 2 digits of GSTIN (state code)
 */

function getStateCode(gstin) {
    if (!gstin || gstin.length < 2) return null;
    return gstin.substring(0, 2);
}

function calculateGST(taxableValue, gstPercent, sellerGSTIN, buyerGSTIN) {
    const sellerState = getStateCode(sellerGSTIN);
    const buyerState = getStateCode(buyerGSTIN);
    const isInterstate = sellerState !== buyerState || !sellerState || !buyerState;

    if (isInterstate) {
        return {
            type: 'IGST',
            igst: +(taxableValue * gstPercent / 100).toFixed(2),
            cgst: 0,
            sgst: 0,
            total: +(taxableValue * (1 + gstPercent / 100)).toFixed(2)
        };
    }

    const halfRate = gstPercent / 2;
    return {
        type: 'CGST+SGST',
        igst: 0,
        cgst: +(taxableValue * halfRate / 100).toFixed(2),
        sgst: +(taxableValue * halfRate / 100).toFixed(2),
        total: +(taxableValue * (1 + gstPercent / 100)).toFixed(2)
    };
}

module.exports = { calculateGST, getStateCode };
