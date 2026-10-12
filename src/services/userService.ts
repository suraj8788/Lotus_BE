import QRCode from "qrcode";
import { User, UserRole } from "../entities/User";
import { userRepository } from "../repositories/userRepository";

const MAX_PROFILE_PICTURE_SIZE_BYTES = 3 * 1024 * 1024;
const PROFILE_PICTURE_PATTERN =
  /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

export interface CreateUserInput {
  fullName: string;
  gender: string;
  mobileNumber: string;
  profilePicture?: string | null;
  role?: UserRole;
}

export interface UpdateUserInput {
  fullName?: string;
  gender?: string;
  mobileNumber?: string;
  profilePicture?: string | null;
  role?: UserRole;
}

export interface SignInInput {
  mobileNumber: string;
}

export interface SignInResult {
  success: true;
  message: "Sign in successful";
  user: {
    id: string;
    fullName: string;
    gender: string;
    mobileNumber: string;
    qrCode: string;
    role: UserRole;
  };
}

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

class UserService {
  async signIn(input: SignInInput): Promise<SignInResult> {
    const mobileNumber = this.normalizeMobileNumber(input?.mobileNumber);
    const existingUser =
      await userRepository.findByMobileNumber(mobileNumber);

    if (!existingUser) {
      throw new UserServiceError(
        "No registered user found with this mobile number",
        404,
      );
    }

    const user = await this.ensureQrCode(existingUser);

    return {
      success: true,
      message: "Sign in successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        gender: user.gender,
        mobileNumber: user.mobileNumber,
        qrCode: user.qrCode!,
        role: user.role,
      },
    };
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const fullName = this.normalizeRequiredText(input.fullName, "Full name");
    const gender = this.normalizeRequiredText(input.gender, "Gender");
    const mobileNumber = this.normalizeMobileNumber(input.mobileNumber);

    await this.ensureMobileNumberIsAvailable(mobileNumber);

    const user = userRepository.create({
      fullName,
      gender,
      mobileNumber,
      profilePicture: this.normalizeProfilePicture(input.profilePicture),
      role: this.normalizeRole(input.role),
    });

    const savedUser = await userRepository.save(user);
    savedUser.qrCode = await this.generateQrCode(savedUser.id);

    return userRepository.save(savedUser);
  }

  async getAllUsers(): Promise<User[]> {
    const users = await userRepository.findAll();

    return Promise.all(users.map((user) => this.ensureQrCode(user)));
  }

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new UserServiceError("User not found", 404);
    }

    return this.ensureQrCode(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.getUserById(id);

    if (input.fullName !== undefined) {
      user.fullName = this.normalizeRequiredText(input.fullName, "Full name");
    }

    if (input.gender !== undefined) {
      user.gender = this.normalizeRequiredText(input.gender, "Gender");
    }

    if (input.mobileNumber !== undefined) {
      const mobileNumber = this.normalizeMobileNumber(input.mobileNumber);

      if (mobileNumber !== user.mobileNumber) {
        await this.ensureMobileNumberIsAvailable(mobileNumber);
        user.mobileNumber = mobileNumber;
      }
    }

    if (input.profilePicture !== undefined) {
      user.profilePicture = this.normalizeProfilePicture(input.profilePicture);
    }

    if (input.role !== undefined) {
      user.role = this.normalizeRole(input.role);
    }

    return userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await userRepository.remove(user);
  }

  private async ensureMobileNumberIsAvailable(
    mobileNumber: string,
  ): Promise<void> {
    const existingUser =
      await userRepository.findByMobileNumber(mobileNumber);

    if (existingUser) {
      throw new UserServiceError(
        "A user with this mobile number already exists",
        409,
      );
    }
  }

  private normalizeRequiredText(value: string, fieldName: string): string {
    const normalizedValue = typeof value === "string" ? value.trim() : "";

    if (!normalizedValue) {
      throw new UserServiceError(`${fieldName} is required`, 400);
    }

    return normalizedValue;
  }

  private normalizeMobileNumber(mobileNumber: string): string {
    const normalizedMobileNumber =
      typeof mobileNumber === "string" ? mobileNumber.trim() : "";
    const mobileNumberPattern = /^\+?[0-9]{7,15}$/;

    if (!mobileNumberPattern.test(normalizedMobileNumber)) {
      throw new UserServiceError(
        "A valid mobile number is required (7 to 15 digits)",
        400,
      );
    }

    return normalizedMobileNumber;
  }

  private normalizeProfilePicture(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return null;
    }

    const match = PROFILE_PICTURE_PATTERN.exec(normalizedValue);

    if (!match) {
      throw new UserServiceError(
        "Profile picture must be a valid PNG, JPEG, WebP, or GIF Base64 data URL",
        400,
      );
    }

    const imageSize = Buffer.byteLength(match[2], "base64");

    if (imageSize > MAX_PROFILE_PICTURE_SIZE_BYTES) {
      throw new UserServiceError(
        "Profile picture must not exceed 3 MB",
        413,
      );
    }

    return normalizedValue;
  }

  private normalizeRole(value?: UserRole): UserRole {
    if (value === undefined) {
      return UserRole.USER;
    }

    if (!Object.values(UserRole).includes(value)) {
      throw new UserServiceError(
        `Role must be one of: ${Object.values(UserRole).join(", ")}`,
        400,
      );
    }

    return value;
  }

  private async ensureQrCode(user: User): Promise<User> {
    if (user.qrCode) {
      return user;
    }

    user.qrCode = await this.generateQrCode(user.id);
    return userRepository.save(user);
  }

  private generateQrCode(userId: string): Promise<string> {
    return QRCode.toDataURL(`user:${userId}`, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
  }
}

export const userService = new UserService();
