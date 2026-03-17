import express from 'express';
import { allUsers, singleUser } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/', allUsers);
userRouter.get("/:id", singleUser);

export default userRouter;