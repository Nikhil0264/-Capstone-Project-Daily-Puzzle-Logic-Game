import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { error: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const scoreSubmissionLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 5, 
    message: { error: "Too many score submissions, please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
});
