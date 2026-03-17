import express from 'express';
import requireAuth from '../middleware/auth.js';
import {loginLimiter} from '../middleware/rateLimiter.js';
import { loginPage, loginUser, signupPage, signupUser, logoutUser, updateUser, changePassword, deleteUser, checkUsername} from '../controllers/authController.js';
import { validateAuth, validateRequest,validateUpdateProfile } from '../middleware/validator.js';

const authRouter = express.Router();



//  PUBLIC ROUTES (No Auth needed)
authRouter.get("/login", loginPage);
authRouter.post("/login",loginLimiter, loginUser);

// Protect the signup endpoint
authRouter.get("/signup", signupPage);
authRouter.post("/signup", validateAuth, validateRequest, signupUser);

//  PROTECTED "ME" ROUTES (Auth REQUIRED)
authRouter.get("/logout", requireAuth, logoutUser);
authRouter.put("/update-profile", requireAuth, validateUpdateProfile, validateRequest,updateUser);
authRouter.put("/change-password", requireAuth, changePassword);
authRouter.delete("/delete", requireAuth, deleteUser);

authRouter.get("/check-username", checkUsername);

export default authRouter;