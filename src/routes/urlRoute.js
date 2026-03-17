import express from "express";
import {urlLimiter} from "../middleware/rateLimiter.js";
import { createShortUrl, redirectUrl, getUserUrls, getUrlAnalytics, deleteUrl, exploreUrl} from "../controllers/urlController.js";
import { validateUrlCreation, validateRequest } from '../middleware/validator.js';

const urlRouter = express.Router();


// The request must pass the rate limiter -> then validation rules -> then the error catcher -> then it creates the URL.
urlRouter.post("/", urlLimiter,validateUrlCreation,validateRequest,createShortUrl);

urlRouter.get("/", getUserUrls);

urlRouter.get("/:id/analytics", getUrlAnalytics);

urlRouter.delete("/:id", deleteUrl);

urlRouter.get("/explore", exploreUrl);

urlRouter.get("/:shortCode", redirectUrl);



export default urlRouter;