import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { KeyShowEntry } from "./KeyShowEntry";
import { User } from "./User";

@Entity({ name: "lucky_draw_winners" })
@Unique("UQ_lucky_draw_winner_user", ["userId"])
export class LuckyDrawWinner {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "key_show_entry_id", type: "uuid" })
  keyShowEntryId!: string;

  @ManyToOne(() => KeyShowEntry, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "key_show_entry_id" })
  keyShowEntry!: KeyShowEntry;

  @Column({ name: "draw_date", type: "date" })
  drawDate!: string;

  @Column({ name: "selected_by", type: "uuid" })
  selectedBy!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "selected_by" })
  selectedByUser!: User;

  @CreateDateColumn({ name: "selected_at", type: "timestamptz" })
  selectedAt!: Date;
}
