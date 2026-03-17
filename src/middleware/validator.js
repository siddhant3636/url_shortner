import { body, validationResult } from 'express-validator';

//  1. The Error Catcher
// This checks the results of the rules below. If a rule fails, it blocks the request.
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Return the first error message formatted nicely
        return res.status(400).json({ 
            success: false, 
            message: `Validation Failed: ${errors.array()[0].msg}` 
        });
    }
    next();
};

//  2. URL Shortening Rules
export const validateUrlCreation = [
    body('originalUrl')
        .trim()
        .notEmpty().withMessage('URL cannot be empty.')
        .isURL({ require_protocol: true, require_valid_protocol: true })
        .withMessage('System Reject: Invalid URL format. Protocol (http:// or https://) required.')
];

//  3. Auth (Signup/Profile) Rules
export const validateAuth = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters.')
        .isAlphanumeric().withMessage('Username can only contain letters and numbers. No spaces or special characters.')
        .escape(), // Translates < > ' " & to HTML entities safely
    body('email')
        .optional() // If you use emails
        .trim()
        .isEmail().withMessage('Must be a valid email address.')
        .normalizeEmail(), // Converts SIddhant@GMAIL.com to siddhant@gmail.com
    body('password')
        .isLength({ min: 6 }).withMessage('Security Policy: Password must be at least 6 characters.')
];
export const validateUpdateProfile = [
    body('username')
        .notEmpty().withMessage('Username cannot be empty')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .trim(),
    
    // Notice what is NOT here: The password validation!
];