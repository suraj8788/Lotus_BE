import { Router } from "express";
import { userController } from "../controllers/userController";

const userRouter = Router();

userRouter.post("/sign-in", userController.signIn);
userRouter.post("/", userController.createUser);
userRouter.get("/", userController.getAllUsers);
userRouter.get("/:id/event-pass.pdf", userController.downloadEventPass);
userRouter.get("/:id", userController.getUserById);
userRouter.put("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);

export default userRouter;
