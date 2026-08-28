import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 7, nullable: true, default: '#FF6B6B' })
  color?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt!: Date;
}
