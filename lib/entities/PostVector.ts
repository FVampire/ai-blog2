import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn
} from 'typeorm';

import { Post } from './Post';

@Entity('post_vectors')
export class PostVector {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'post_id', type: 'int', unique: true })
  postId!: number;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  // pgvector 类型，TypeORM 不原生支持，使用 raw column type
  @Column({ name: 'content_vector', type: 'text', nullable: true })
  contentVector?: string;

  @Column({ name: 'excerpt_vector', type: 'text', nullable: true })
  excerptVector?: string;

  @Column({ name: 'title_vector', type: 'text', nullable: true })
  titleVector?: string;

  @Column({ name: 'embedding_model', type: 'varchar', length: 100, default: 'bge-m3' })
  embeddingModel!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
