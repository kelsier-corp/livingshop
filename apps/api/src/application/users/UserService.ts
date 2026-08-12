import { User } from "@domain/entities/User";
import { NotFoundError } from "@domain/errors/DomainError";
import { UserRepository } from "@domain/repositories/UserRepository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  list(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError("User", id);
    return user;
  }
}
