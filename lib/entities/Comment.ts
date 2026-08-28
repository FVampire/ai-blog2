import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';

import { Post } from './Post';
import { User } from './User';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'post_id', type: 'int', nullable: true })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  @Column({ name: 'visitor_id', type: 'varchar', length: 36 })
  visitorId!: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId?: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
