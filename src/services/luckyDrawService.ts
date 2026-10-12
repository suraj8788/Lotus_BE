import { randomInt } from "node:crypto";
import { AppDataSource } from "../config/data-source";
import { KeyShowEntry } from "../entities/KeyShowEntry";
import { LuckyDrawWinner } from "../entities/LuckyDrawWinner";
import { User, UserRole } from "../entities/User";
import { luckyDrawRepository } from "../repositories/luckyDrawRepository";
import { userService } from "./userService";

const EVENT_TIMEZONE = process.env.EVENT_TIMEZONE ?? "Asia/Kolkata";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SpinLuckyDrawInput {
  adminUserId: string;
}

type LuckyDrawParticipant = Pick<
  User,
  "id" | "fullName" | "mobileNumber" | "profilePicture"
>;

export class LuckyDrawServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "LuckyDrawServiceError";
  }
}

class LuckyDrawService {
  async getEligibleParticipants(adminUserId: string) {
    await this.ensureAdmin(adminUserId);
    const drawDate = this.getToday();
    const [entries, latestWinner] = await Promise.all([
      luckyDrawRepository.findEligibleEntries(),
      luckyDrawRepository.findLatestWinnerByDate(drawDate),
    ]);

    return {
      success: true as const,
      drawDate,
      eligibleCount: entries.length,
      latestWinner: latestWinner
        ? this.toParticipant(latestWinner.user)
        : null,
    };
  }

  async spin(input: SpinLuckyDrawInput) {
    await this.ensureAdmin(input?.adminUserId);
    const drawDate = this.getToday();

    return AppDataSource.transaction(async (manager) => {
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        [`lucky-draw:${drawDate}`],
      );

      const eligibleEntries = await luckyDrawRepository.findEligibleEntries(
        manager,
      );
      if (!eligibleEntries.length) {
        throw new LuckyDrawServiceError(
          "No active eligible users are available for the lucky draw",
          409,
        );
      }

      const winningEntry = eligibleEntries[randomInt(eligibleEntries.length)];
      const savedWinner = await luckyDrawRepository.createAndSave(
        {
          userId: winningEntry.userId,
          keyShowEntryId: winningEntry.id,
          drawDate,
          selectedBy: input.adminUserId,
        },
        manager,
      );

      return {
        success: true as const,
        drawDate,
        winnerId: savedWinner.id,
        winner: this.toParticipant(winningEntry.user),
      };
    });
  }

  private async ensureAdmin(adminUserId: unknown): Promise<void> {
    if (typeof adminUserId !== "string" || !UUID_PATTERN.test(adminUserId)) {
      throw new LuckyDrawServiceError("A valid admin user ID is required", 400);
    }

    const admin = await userService.getUserById(adminUserId);
    if (admin.role !== UserRole.ADMIN) {
      throw new LuckyDrawServiceError(
        "Only ADMIN users can manage the lucky draw",
        403,
      );
    }
  }

  private toParticipant(user: User): LuckyDrawParticipant {
    return {
      id: user.id,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      profilePicture: user.profilePicture,
    };
  }

  private getToday(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: EVENT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  }
}

export const luckyDrawService = new LuckyDrawService();
