import { DeepPartial } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

class UserRepository {
  private get repository() {
    return AppDataSource.getRepository(User);
  }

  create(data: DeepPartial<User>): User {
    return this.repository.create(data);
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | null> {
    return this.repository.findOne({ where: { mobileNumber } });
  }

  async remove(user: User): Promise<void> {
    await this.repository.remove(user);
  }
}

export const userRepository = new UserRepository();
