import { Router } from "express";
import { luckyDrawController } from "../controllers/luckyDrawController";

const luckyDrawRouter = Router();

luckyDrawRouter.get("/eligible", luckyDrawController.getEligibleParticipants);
luckyDrawRouter.post("/spin", luckyDrawController.spin);

export default luckyDrawRouter;
