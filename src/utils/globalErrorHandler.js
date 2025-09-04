const developementError = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        statusCode: err.statusCode || 500,
        status: err.status || 'error',
        message: err.message || 'Internal Server Error',
        isOperational: err.isOperational || false,
        stack: err.stack || 'No stack trace available',
        data: err.data || null
    });
}

const productionError = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;
    if (isOperational) {
        return res.status(statusCode).json({
            success: false,
            statusCode: err.statusCode || 500,
            message: err.message || 'Internal Server Error'
        });
    } else {
        return res.status(statusCode).json({
        success: false,
        statusCode: err.statusCode || 500,
        message: 'Internal Server Error'
        });
    }
}

export default (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        return developementError(err, req, res, next);
    } else if (process.env.NODE_ENV === 'production') {
        return productionError(err, req, res, next);
    } else {
        res.status(500).json({
            success: false,
            message: 'Unknown Environment Error'
        });
    }
}