const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error(err.stack);

    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists',
            field: err.meta?.target
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (err.name === 'ZodError') {
        const fieldErrors = {};
        err.errors.forEach(e => {
            fieldErrors[e.path.join('.')] = e.message;
        });
        return res.status(422).json({ success: false, message: 'Validation failed', errors: fieldErrors });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

module.exports = { errorHandler };
