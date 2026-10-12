import { Between } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { KeyShowEntry } from "../entities/KeyShowEntry";

class KeyShowEntryRepository {
  private get repository() {
    return AppDataSource.getRepository(KeyShowEntry);
  }

  async createIfNotEnteredToday(
    userId: string,
    entryDate: string,
  ): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(KeyShowEntry)
      .values({ userId, entryDate })
      .orIgnore()
      .returning("id")
      .execute();

    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  async findByUserId(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<KeyShowEntry[]> {
    return this.repository.find({
      where: {
        userId,
        entryDate: Between(startDate, endDate),
      },
      order: { entryDate: "ASC" },
    });
  }
}

export const keyShowEntryRepository = new KeyShowEntryRepository();
