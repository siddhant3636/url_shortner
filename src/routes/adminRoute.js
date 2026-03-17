import express from "express";
import requireAdmin from "../middleware/requireAdmin.js";
import { getAdminDashboard, deleteUserByAdmin} from "../controllers/adminController.js";

const adminRouter = express.Router();


adminRouter.get('/dashboard', requireAdmin, getAdminDashboard);
adminRouter.delete("/user/:userId", requireAdmin, deleteUserByAdmin);





export default adminRouter;