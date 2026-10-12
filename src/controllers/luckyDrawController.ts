import { NextFunction, Request, Response } from "express";
import {
  SpinLuckyDrawInput,
  luckyDrawService,
} from "../services/luckyDrawService";

class LuckyDrawController {
  getEligibleParticipants = async (
    request: Request<
      Record<string, never>,
      unknown,
      unknown,
      { adminUserId?: string }
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await luckyDrawService.getEligibleParticipants(
        request.query.adminUserId ?? "",
      );
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  spin = async (
    request: Request<Record<string, never>, unknown, SpinLuckyDrawInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await luckyDrawService.spin(request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const luckyDrawController = new LuckyDrawController();
