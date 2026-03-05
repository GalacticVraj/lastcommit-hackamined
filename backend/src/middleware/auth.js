const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId, isActive: true, deletedAt: null },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found or inactive' });
        }

        // Flatten permissions
        const permissions = [];
        user.roles.forEach(ur => {
            ur.role.permissions.forEach(rp => {
                const perm = `${rp.permission.module}.${rp.permission.action}`;
                if (!permissions.includes(perm)) permissions.push(perm);
            });
        });

        req.user = { id: user.id, name: user.name, email: user.email, permissions };
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        next(error);
    }
};

module.exports = { authenticate };
