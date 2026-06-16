import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';

import { Post } from './Post';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'post_id', type: 'int' })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  @Column({ name: 'author_name', type: 'varchar', length: 100 })
  authorName!: string;

  @Column({ name: 'author_email', type: 'varchar', length: 255, nullable: true })
  authorEmail?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected' | 'spam';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
