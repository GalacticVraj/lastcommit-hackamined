const { PrismaClient } = require('@prisma/client');

const prismaClient = new PrismaClient();

// Add Prisma Extension to handle soft deletes and audit fields globally
const prisma = prismaClient.$extends({
    query: {
        $allModels: {
            // Soft Delete on delete/deleteMany
            async delete({ model, args, query }) {
                const modelFields = prismaClient._runtimeDataModel.models[model].fields.map(f => f.name);
                if (modelFields.includes('deletedAt')) {
                    args.data = { deletedAt: new Date() };
                    // We must use update instead of delete if it has a deletedAt field
                    return prismaClient[model].update({
                        where: args.where,
                        data: args.data,
                    });
                }
                return query(args);
            },
            async deleteMany({ model, args, query }) {
                const modelFields = prismaClient._runtimeDataModel.models[model].fields.map(f => f.name);
                if (modelFields.includes('deletedAt')) {
                    args.data = { deletedAt: new Date() };
                    return prismaClient[model].updateMany({
                        where: args.where,
                        data: args.data,
                    });
                }
                return query(args);
            },

            // Exclude soft-deleted records from find operations automatically
            async findMany({ model, args, query }) {
                const modelFields = prismaClient._runtimeDataModel.models[model].fields.map(f => f.name);
                if (modelFields.includes('deletedAt')) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                const modelFields = prismaClient._runtimeDataModel.models[model].fields.map(f => f.name);
                if (modelFields.includes('deletedAt')) {
                    args.where = { ...args.where, deletedAt: null };
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                // For findUnique, if we inject deletedAt: null, it forces it to findFirst under the hood in Prisma.
                // It's safer to just let the developer explicitly ensure uniqueness or we swap it to findFirst in extension.
                const modelFields = prismaClient._runtimeDataModel.models[model].fields.map(f => f.name);
                if (modelFields.includes('deletedAt')) {
                    // Try to catch the unique find and reject if deleted
                    const result = await query(args);
                    if (result && result.deletedAt) {
                        return null; // Don't return soft-deleted unique records
                    }
                    return result;
                }
                return query(args);
            }
        }
    }
});

module.exports = prisma;
