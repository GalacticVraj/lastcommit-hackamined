const checkPermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Super Admin bypass
        if (req.user.permissions.includes('*')) {
            return next();
        }

        const hasPermission = requiredPermissions.some(perm =>
            req.user.permissions.includes(perm)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `Access denied: ${requiredPermissions.join(', ')}`
            });
        }

        next();
    };
};

module.exports = { checkPermission };
