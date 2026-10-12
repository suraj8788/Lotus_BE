import { NextFunction, Request, Response } from "express";
import {
  ScanQrInput,
  keyShowEntryService,
} from "../services/keyShowEntryService";

class KeyShowEntryController {
  scanQr = async (
    request: Request<Record<string, never>, unknown, ScanQrInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await keyShowEntryService.scanQr(request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getUserHistory = async (
    request: Request<{ userId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await keyShowEntryService.getUserHistory(
        request.params.userId,
      );
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const keyShowEntryController = new KeyShowEntryController();
