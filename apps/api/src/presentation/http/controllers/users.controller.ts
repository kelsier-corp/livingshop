import { Request, Response } from "express";
import { UserService } from "@application/users/UserService";

export class UsersController {
  constructor(private readonly userService: UserService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.list();
    res.json(users);
  };
}
