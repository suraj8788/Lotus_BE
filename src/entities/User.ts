import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  USER = "USER",
  SCANNER = "SCANNER",
  ADMIN = "ADMIN",
}

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "full_name", type: "varchar", length: 100 })
  fullName!: string;

  @Column({ type: "varchar", length: 50 })
  gender!: string;

  @Column({ name: "mobile_number", type: "varchar", length: 20, unique: true })
  mobileNumber!: string;

  @Column({ name: "profile_picture", type: "text", nullable: true })
  profilePicture!: string | null;

  @Column({ name: "qr_code", type: "text", nullable: true })
  qrCode!: string | null;

  @Column({ type: "varchar", length: 20, default: UserRole.USER })
  role!: UserRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
