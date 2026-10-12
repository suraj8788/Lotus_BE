import { NextFunction, Request, Response } from "express";
import {
  CreateUserInput,
  SignInInput,
  UpdateUserInput,
  userService,
} from "../services/userService";
import { eventPassService } from "../services/eventPassService";

class UserController {
  signIn = async (
    request: Request<Record<string, never>, unknown, SignInInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await userService.signIn(request.body);
      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (
    request: Request<Record<string, never>, unknown, CreateUserInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.createUser(request.body);
      response.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const users = await userService.getAllUsers();
      response.status(200).json(users);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.getUserById(request.params.id);
      response.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  downloadEventPass = async (
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.getUserById(request.params.id);
      const pdf = await eventPassService.generate(user);

      response.setHeader("Content-Type", "application/pdf");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="event-pass-${user.id}.pdf"`,
      );
      response.setHeader("Content-Length", pdf.length.toString());
      response.status(200).send(pdf);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (
    request: Request<{ id: string }, unknown, UpdateUserInput>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.updateUser(
        request.params.id,
        request.body,
      );
      response.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (
    request: Request<{ id: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await userService.deleteUser(request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
