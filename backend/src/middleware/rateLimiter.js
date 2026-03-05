// Simple in-memory rate limiter
const requestCounts = new Map();

const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = req.user?.permissions?.includes('*') ? 200 : 60;

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: now });
        return next();
    }

    const record = requestCounts.get(ip);

    if (now - record.startTime > windowMs) {
        record.count = 1;
        record.startTime = now;
        return next();
    }

    record.count++;

    if (record.count > maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }

    next();
};

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts) {
        if (now - record.startTime > 300000) requestCounts.delete(ip);
    }
}, 300000);

module.exports = { rateLimiter };
