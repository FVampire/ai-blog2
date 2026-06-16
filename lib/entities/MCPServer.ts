import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('mcp_servers')
export class MCPServer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: 'stdio' })
  transport!: 'stdio' | 'sse' | 'http';

  @Column({ type: 'varchar', length: 50, nullable: true })
  command?: string;

  @Column({ name: 'script_path', type: 'varchar', length: 500, nullable: true })
  scriptPath?: string;

  @Column({ type: 'jsonb', default: '[]' })
  args!: string[];

  @Column({ name: 'env_vars', type: 'jsonb', default: '{}' })
  envVars!: Record<string, string>;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url?: string;

  @Column({ type: 'jsonb', default: '{}' })
  headers!: Record<string, string>;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ name: 'timeout_seconds', type: 'int', default: 30 })
  timeoutSeconds!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
