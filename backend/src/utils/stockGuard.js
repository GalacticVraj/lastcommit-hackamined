const prisma = require('./prisma');
const { errorResponse } = require('./responseHelper');

/**
 * Check that a product has sufficient stock before issuing/dispatching.
 * Returns null if OK, or sends the 400 error response and returns true if insufficient.
 * 
 * Usage:
 *   if (await checkStock(res, productId, qty)) return;
 */
async function checkStock(res, productId, requestedQty) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, currentStock: true, blockedStock: true }
    });

    if (!product) {
        errorResponse(res, `Product ID ${productId} not found`, 404);
        return true;
    }

    const available = product.currentStock - product.blockedStock;

    if (available < requestedQty) {
        errorResponse(
            res,
            `Insufficient stock for "${product.name}": only ${available} units available`,
            400
        );
        return true;
    }

    return false;
}

/**
 * Validate multiple items at once. Resolves all checks before responding.
 * items: [{ productId, quantity }]
 * Returns null if ok, sends error + returns true if any item insufficient.
 */
async function checkStockBatch(res, items) {
    for (const item of items) {
        const blocked = await checkStock(res, item.productId, item.quantity);
        if (blocked) return true;
    }
    return false;
}

module.exports = { checkStock, checkStockBatch };
