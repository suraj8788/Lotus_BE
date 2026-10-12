import { Router } from "express";
import { keyShowEntryController } from "../controllers/keyShowEntryController";

const keyShowEntryRouter = Router();

keyShowEntryRouter.post("/scan", keyShowEntryController.scanQr);
keyShowEntryRouter.get(
  "/users/:userId",
  keyShowEntryController.getUserHistory,
);

export default keyShowEntryRouter;
