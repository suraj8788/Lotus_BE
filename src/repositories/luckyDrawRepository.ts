import { EntityManager } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { KeyShowEntry } from "../entities/KeyShowEntry";
import { LuckyDrawWinner } from "../entities/LuckyDrawWinner";
import { UserRole } from "../entities/User";

class LuckyDrawRepository {
  private manager(manager?: EntityManager): EntityManager {
    return manager ?? AppDataSource.manager;
  }

  async findEligibleEntries(
    manager?: EntityManager,
  ): Promise<KeyShowEntry[]> {
    return this.manager(manager)
      .getRepository(KeyShowEntry)
      .createQueryBuilder("entry")
      .innerJoinAndSelect("entry.user", "user")
      .leftJoin(
        LuckyDrawWinner,
        "previousWinner",
        "previousWinner.userId = user.id",
      )
      .where("entry.active = :active", { active: true })
      .andWhere("user.role = :role", { role: UserRole.USER })
      .andWhere("previousWinner.id IS NULL")
      .distinctOn(["user.id"])
      .orderBy("user.id", "ASC")
      .addOrderBy("entry.enteredAt", "DESC")
      .getMany();
  }

  async findLatestWinnerByDate(
    drawDate: string,
    manager?: EntityManager,
  ): Promise<LuckyDrawWinner | null> {
    return this.manager(manager).getRepository(LuckyDrawWinner).findOne({
      where: { drawDate },
      relations: { user: true },
      order: { selectedAt: "DESC" },
    });
  }

  createAndSave(
    data: Pick<
      LuckyDrawWinner,
      "userId" | "keyShowEntryId" | "drawDate" | "selectedBy"
    >,
    manager: EntityManager,
  ): Promise<LuckyDrawWinner> {
    const repository = manager.getRepository(LuckyDrawWinner);
    return repository.save(repository.create(data));
  }
}

export const luckyDrawRepository = new LuckyDrawRepository();
