import { KeyShowEntry } from "../entities/KeyShowEntry";
import { UserRole } from "../entities/User";
import { keyShowEntryRepository } from "../repositories/keyShowEntryRepository";
import { userService } from "./userService";

const TOTAL_EVENT_DAYS = 9;
const DEFAULT_EVENT_START_DATE = "2026-10-11";
const DEFAULT_EVENT_TIMEZONE = "Asia/Kolkata";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ScanQrInput {
  qrValue: string;
  scannerUserId: string;
}

interface AttendanceSummary {
  success: true;
  user: {
    id: string;
    fullName: string;
  };
  attendedDays: number;
  totalEventDays: number;
  remainingDays: number;
  today: string;
  eventStartDate: string;
  eventEndDate: string;
  history: KeyShowEntry[];
}

export interface ScanQrResult extends AttendanceSummary {
  status: "entered" | "already_entered";
  message:
    | "Entry recorded successfully."
    | "Duplicate entry! This participant has already checked in today.";
}

export class KeyShowEntryServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "KeyShowEntryServiceError";
  }
}

class KeyShowEntryService {
  async scanQr(input: ScanQrInput): Promise<ScanQrResult> {
    await this.ensureScannerRole(input?.scannerUserId);

    const userId = this.extractUserId(input?.qrValue);
    const user = await userService.getUserById(userId);
    const event = this.getEventConfiguration();
    const today = this.getDateInTimezone(event.timezone);

    this.ensureEventIsActive(today, event.startDate, event.endDate);

    const entryCreated =
      await keyShowEntryRepository.createIfNotEnteredToday(userId, today);
    const history = await keyShowEntryRepository.findByUserId(
      userId,
      event.startDate,
      event.endDate,
    );

    return {
      success: true,
      status: entryCreated ? "entered" : "already_entered",
      message: entryCreated
        ? "Entry recorded successfully."
        : "Duplicate entry! This participant has already checked in today.",
      user: {
        id: user.id,
        fullName: user.fullName,
      },
      ...this.buildAttendanceDetails(history, today, event),
    };
  }

  private async ensureScannerRole(scannerUserId: unknown): Promise<void> {
    if (typeof scannerUserId !== "string" || !UUID_PATTERN.test(scannerUserId)) {
      throw new KeyShowEntryServiceError(
        "A valid scanner user ID is required",
        400,
      );
    }

    const scanner = await userService.getUserById(scannerUserId);

    if (scanner.role !== UserRole.SCANNER) {
      throw new KeyShowEntryServiceError(
        "Only users with the SCANNER role can verify entries",
        403,
      );
    }
  }

  async getUserHistory(userId: string): Promise<AttendanceSummary> {
    if (!UUID_PATTERN.test(userId)) {
      throw new KeyShowEntryServiceError("A valid user ID is required", 400);
    }

    const user = await userService.getUserById(userId);
    const event = this.getEventConfiguration();
    const today = this.getDateInTimezone(event.timezone);
    const history = await keyShowEntryRepository.findByUserId(
      userId,
      event.startDate,
      event.endDate,
    );

    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
      },
      ...this.buildAttendanceDetails(history, today, event),
    };
  }

  private extractUserId(qrValue: unknown): string {
    if (typeof qrValue !== "string") {
      throw new KeyShowEntryServiceError("qrValue is required", 400);
    }

    const match = /^user:(.+)$/i.exec(qrValue.trim());

    if (!match || !UUID_PATTERN.test(match[1])) {
      throw new KeyShowEntryServiceError(
        "Invalid QR value. Expected user:<user-id>",
        400,
      );
    }

    return match[1];
  }

  private getEventConfiguration(): {
    startDate: string;
    endDate: string;
    timezone: string;
  } {
    const startDate =
      process.env.EVENT_START_DATE ?? DEFAULT_EVENT_START_DATE;
    const timezone = process.env.EVENT_TIMEZONE ?? DEFAULT_EVENT_TIMEZONE;

    if (!this.isValidDate(startDate)) {
      throw new KeyShowEntryServiceError(
        "EVENT_START_DATE must use YYYY-MM-DD format",
        500,
      );
    }

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    } catch {
      throw new KeyShowEntryServiceError(
        "EVENT_TIMEZONE is not a valid timezone",
        500,
      );
    }

    return {
      startDate,
      endDate: this.addDays(startDate, TOTAL_EVENT_DAYS - 1),
      timezone,
    };
  }

  private ensureEventIsActive(
    today: string,
    startDate: string,
    endDate: string,
  ): void {
    if (today < startDate) {
      throw new KeyShowEntryServiceError("The event has not started yet", 403);
    }

    if (today > endDate) {
      throw new KeyShowEntryServiceError("The event has ended", 403);
    }
  }

  private buildAttendanceDetails(
    history: KeyShowEntry[],
    today: string,
    event: { startDate: string; endDate: string },
  ) {
    const attendedDays = history.length;

    return {
      attendedDays,
      totalEventDays: TOTAL_EVENT_DAYS,
      remainingDays: Math.max(TOTAL_EVENT_DAYS - attendedDays, 0),
      today,
      eventStartDate: event.startDate,
      eventEndDate: event.endDate,
      history,
    };
  }

  private getDateInTimezone(timezone: string): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  private addDays(date: string, days: number): string {
    const [year, month, day] = date.split("-").map(Number);
    const result = new Date(Date.UTC(year, month - 1, day + days));
    return result.toISOString().slice(0, 10);
  }

  private isValidDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.toISOString().slice(0, 10) === date;
  }
}

export const keyShowEntryService = new KeyShowEntryService();
