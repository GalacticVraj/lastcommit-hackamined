const { errorResponse } = require('../utils/responseHelper');

const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        return errorResponse(res, error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 422);
    }
};

module.exports = { validateRequest };
