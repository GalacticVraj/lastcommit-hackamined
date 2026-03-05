const prisma = require('../utils/prisma');
const { successResponse, paginatedResponse, errorResponse, parseListQuery, buildPagination } = require('../utils/responseHelper');

/**
 * Production Simulation Engine
 * MRP: Reverse BOM explosion → material requirements
 * CRP: Routing-based capacity requirements
 * Costing: Labor + Electricity + Material
 */
const ctrl = {
    async runSimulation(req, res, next) {
        try {
            const { inputs, shiftHours = 10, workerCount = 50, laborRate = 250, kwhRate = 8 } = req.body;
            // inputs: [{ productId, targetQty }]

            if (!inputs || !inputs.length) return errorResponse(res, 'At least one product input is required', 422);

            // Create simulation run
            const run = await prisma.simulationRun.create({
                data: { shiftHours, workerCount, createdBy: req.user.id, inputs: { create: inputs } }
            });

            // ── MRP: BOM Explosion ──
            const materialMap = {}; // { materialName: { required, available, unitCost } }
            let totalManHours = 0;
            let totalMachineHours = 0;

            for (const input of inputs) {
                const product = await prisma.product.findUnique({ where: { id: input.productId }, include: { bomHeaders: { where: { isActive: true }, take: 1, include: { items: { include: { product: true } } } }, routingTables: true } });
                if (!product) continue;

                // BOM explosion
                const bom = product.bomHeaders[0];
                if (bom) {
                    for (const item of bom.items) {
                        const reqQty = input.targetQty * item.qtyPerUnit;
                        const key = item.product.name;
                        if (!materialMap[key]) {
                            materialMap[key] = { requiredQty: 0, availableQty: item.product.currentStock, unitCost: item.product.lastPurchasePrice || 0 };
                        }
                        materialMap[key].requiredQty += reqQty;
                    }
                }

                // CRP from routing
                for (const route of product.routingTables) {
                    totalManHours += input.targetQty * route.manHours;
                    totalMachineHours += input.targetQty * route.machineHours;
                }

                // Fallback to product-level if no routing
                if (!product.routingTables.length) {
                    totalManHours += input.targetQty * (product.manHoursPerUnit || 0);
                    totalMachineHours += input.targetQty * (product.machineHoursPerUnit || 0);
                }
            }

            // ── CRP Calculation ──
            const daysRequired = totalManHours / (workerCount * shiftHours) || 0;

            // ── Cost Estimation ──
            const laborCost = totalManHours * laborRate;
            const electricityCost = totalMachineHours * kwhRate;
            let materialCost = 0;

            // Save results and calculate material readiness
            const resultData = [];
            let totalMaterials = 0;
            let readyMaterials = 0;

            for (const [name, mat] of Object.entries(materialMap)) {
                const shortfall = Math.max(0, mat.requiredQty - mat.availableQty);
                const lineCost = mat.requiredQty * mat.unitCost;
                materialCost += lineCost;
                totalMaterials++;
                if (shortfall === 0) readyMaterials++;

                resultData.push({
                    simulationRunId: run.id,
                    materialName: name,
                    requiredQty: +mat.requiredQty.toFixed(2),
                    availableQty: +mat.availableQty.toFixed(2),
                    shortfall: +shortfall.toFixed(2),
                    unitCost: +mat.unitCost.toFixed(2),
                    totalCost: +lineCost.toFixed(2)
                });
            }

            const materialReadiness = totalMaterials > 0 ? (readyMaterials / totalMaterials) * 100 : 100;
            const totalCost = laborCost + electricityCost + materialCost;

            // Save results
            if (resultData.length) {
                await prisma.simulationResult.createMany({ data: resultData });
            }

            await prisma.simulationRun.update({
                where: { id: run.id },
                data: {
                    totalManHours: +totalManHours.toFixed(2),
                    totalMachineHours: +totalMachineHours.toFixed(2),
                    daysRequired: +daysRequired.toFixed(2),
                    laborCost: +laborCost.toFixed(2),
                    electricityCost: +electricityCost.toFixed(2),
                    materialCost: +materialCost.toFixed(2),
                    totalCost: +totalCost.toFixed(2),
                    materialReadiness: +materialReadiness.toFixed(2)
                }
            });

            return successResponse(res, {
                simulationId: run.id,
                crpSummary: {
                    totalManHours: +totalManHours.toFixed(2),
                    totalMachineHours: +totalMachineHours.toFixed(2),
                    daysRequired: +daysRequired.toFixed(2),
                    shiftHours,
                    workerCount
                },
                costBreakdown: {
                    laborCost: +laborCost.toFixed(2),
                    electricityCost: +electricityCost.toFixed(2),
                    materialCost: +materialCost.toFixed(2),
                    totalCost: +totalCost.toFixed(2)
                },
                materialReadinessPercent: +materialReadiness.toFixed(2),
                mrpBreakdown: resultData
            }, 'Simulation completed');
        } catch (e) { next(e); }
    },

    async listSimulations(req, res, next) {
        try {
            const { page, perPage, skip } = parseListQuery(req.query);
            const [data, total] = await Promise.all([
                prisma.simulationRun.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }),
                prisma.simulationRun.count()
            ]);
            return paginatedResponse(res, data, buildPagination(page, perPage, total));
        } catch (e) { next(e); }
    },

    async getSimulation(req, res, next) {
        try {
            const sim = await prisma.simulationRun.findUnique({
                where: { id: parseInt(req.params.id) },
                include: { inputs: true, results: true }
            });
            if (!sim) return errorResponse(res, 'Simulation not found', 404);
            return successResponse(res, sim);
        } catch (e) { next(e); }
    }
};

module.exports = ctrl;
