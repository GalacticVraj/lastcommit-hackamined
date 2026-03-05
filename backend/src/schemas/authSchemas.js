const { z } = require('zod');

const authSchemas = {
    login: z.object({
        body: z.object({
            email: z.string().email('Invalid email format'),
            password: z.string().min(1, 'Password is required')
        })
    }),
    register: z.object({
        body: z.object({
            name: z.string().min(2, 'Name requires at least 2 characters'),
            email: z.string().email('Invalid email format'),
            password: z.string().min(6, 'Password requires at least 6 characters'),
            roleIds: z.array(z.string()).optional()
        })
    })
};

module.exports = { authSchemas };
