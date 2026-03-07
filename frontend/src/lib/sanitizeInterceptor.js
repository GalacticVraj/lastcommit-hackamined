/**
 * API Request Interceptor for deep payload sanitization
 * Recursively strips explicit HTML tags from all string payloads
 * to prevent XSS attacks before they hit the network.
 */
export const sanitizePayload = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    // Create deep copy to avoid mutating original objects unexpectedly if spread elsewhere
    const sanitized = Array.isArray(obj) ? [] : {};

    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            // Strips explicit HTML tags `<something>`
            sanitized[key] = obj[key].replace(/<\/?[^>]+(>|$)/g, "");
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitized[key] = sanitizePayload(obj[key]);
        } else {
            sanitized[key] = obj[key];
        }
    }
    return sanitized;
};
