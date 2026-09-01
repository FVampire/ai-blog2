import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, JoinTable, JoinColumn
} from 'typeorm';

import { PostCategory } from './PostCategory';
import { Tag } from './Tag';
import { User } from './User';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: 'draft' | 'published' | 'archived';

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ name: 'author_id', type: 'int', nullable: true })
  authorId?: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId?: number | null;

  @ManyToOne(() => PostCategory, (category) => category.posts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: PostCategory;

  @Column({ name: 'prev_post_id', type: 'int', nullable: true })
  prevPostId?: number;

  @Column({ name: 'next_post_id', type: 'int', nullable: true })
  nextPostId?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ManyToMany(() => Tag, { eager: false })
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id' },
    inverseJoinColumn: { name: 'tag_id' },
  })
  tags?: Tag[];
}
