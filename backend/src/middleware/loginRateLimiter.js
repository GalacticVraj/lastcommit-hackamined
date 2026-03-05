const requestCounts = new Map();

const loginRateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const blockDuration = 15 * 60 * 1000; // 15 mins block
    const maxRequests = 5;

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, { count: 1, startTime: now, blockedUntil: null });
        return next();
    }

    const record = requestCounts.get(ip);

    // If currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
        return res.status(429).json({
            success: false,
            message: 'Too many failed login attempts. Please try again after 15 minutes.'
        });
    }

    // Reset window if passed block or passed 1 minute
    if ((record.blockedUntil && now > record.blockedUntil) || (!record.blockedUntil && now - record.startTime > windowMs)) {
        record.count = 1;
        record.startTime = now;
        record.blockedUntil = null;
        return next();
    }

    // Increment request count
    record.count++;

    if (record.count > maxRequests) {
        record.blockedUntil = now + blockDuration; // Apply 15 minute block
        return res.status(429).json({
            success: false,
            message: 'Too many failed login attempts. Please try again after 15 minutes.'
        });
    }

    next();
};

// Periodic Cleanup every 15 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts) {
        if (!record.blockedUntil && now - record.startTime > 60000) {
            requestCounts.delete(ip);
        } else if (record.blockedUntil && now > record.blockedUntil) {
            requestCounts.delete(ip);
        }
    }
}, 15 * 60 * 1000);

module.exports = { loginRateLimiter };
