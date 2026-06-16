import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: 'admin' | 'author' | 'user';

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
