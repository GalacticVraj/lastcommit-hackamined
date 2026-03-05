const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const authController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return errorResponse(res, 'Email and password are required', 422);
            }

            const user = await prisma.user.findUnique({
                where: { email, isActive: true, deletedAt: null },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: { include: { permission: true } }
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return errorResponse(res, 'Invalid credentials', 401);
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return errorResponse(res, 'Invalid credentials', 401);
            }

            // Flatten permissions
            const permissions = [];
            const roleNames = [];
            user.roles.forEach(ur => {
                roleNames.push(ur.role.name);
                ur.role.permissions.forEach(rp => {
                    const perm = `${rp.permission.module}.${rp.permission.action}`;
                    if (!permissions.includes(perm)) permissions.push(perm);
                });
            });

            const token = jwt.sign(
                { userId: user.id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            return successResponse(res, {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: roleNames,
                    permissions
                }
            }, 'Login successful');
        } catch (error) {
            next(error);
        }
    },

    async register(req, res, next) {
        try {
            const { name, email, password, roleIds } = req.body;
            if (!name || !email || !password) {
                return errorResponse(res, 'Name, email, and password are required', 422);
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    roles: {
                        create: (roleIds || []).map(roleId => ({ roleId }))
                    }
                },
                include: { roles: { include: { role: true } } }
            });

            return successResponse(res, {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: user.roles.map(ur => ur.role.name)
            }, 'User created successfully', 201);
        } catch (error) {
            next(error);
        }
    },

    async me(req, res, next) {
        try {
            return successResponse(res, {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                permissions: req.user.permissions
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req, res, next) {
        try {
            return successResponse(res, null, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    },

    async getPermissions(req, res, next) {
        try {
            const permissions = await prisma.permission.findMany({
                orderBy: [{ module: 'asc' }, { action: 'asc' }]
            });
            return successResponse(res, permissions);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
