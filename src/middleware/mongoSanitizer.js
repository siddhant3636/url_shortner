import mongoSanitize from 'express-mongo-sanitize';

export const mongoSanitizer =(req, res, next) => {
    // Only sanitize the body and params. We safely ignore the query to prevent crashes.
    if (req.body) req.body = mongoSanitize.sanitize(req.body);
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
    next();
}