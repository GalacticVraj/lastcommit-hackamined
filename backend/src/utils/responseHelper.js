/**
 * Standard API response helpers
 * Envelope: { success, data, message, pagination }
 */

function successResponse(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        message
    });
}

function paginatedResponse(res, data, pagination, message = 'Success') {
    return res.status(200).json({
        success: true,
        data,
        message,
        pagination
    });
}

function errorResponse(res, message = 'Error', statusCode = 400) {
    return res.status(statusCode).json({
        success: false,
        message
    });
}

/**
 * Parse common query parameters for list endpoints
 * Supports: ?search=, ?per_page=, ?page=, ?sort_by=, ?sort_order=, ?filters[status]=
 */
function parseListQuery(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(query.per_page) || 25));
    const skip = (page - 1) * perPage;
    const sortBy = query.sort_by || 'createdAt';
    const sortOrder = query.sort_order === 'asc' ? 'asc' : 'desc';
    const search = query.search || '';

    // Parse filters[key]=value
    const filters = {};
    if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
            filters[key] = value;
        });
    }

    return { page, perPage, skip, sortBy, sortOrder, search, filters };
}

function buildPagination(page, perPage, total) {
    return {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage)
    };
}

module.exports = { successResponse, paginatedResponse, errorResponse, parseListQuery, buildPagination };
