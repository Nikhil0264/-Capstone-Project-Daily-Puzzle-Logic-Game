export const errorHandler = (err, req, res, next) => {
    const isProd = process.env.NODE_ENV === "production";

    // Log full details on server logs in non-production; log concise on production
    if (isProd) {
        console.error("Error:", err.message);
    } else {
        console.error("Error Stack:", err.stack);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Don't leak internal errors to clients in production
    const payload = {
        message: isProd ? "Internal Server Error" : err.message
    };

    if (!isProd) payload.stack = err.stack;

    res.status(statusCode).json(payload);
};
