import bcrypt from 'bcryptjs';
import { BaseRepository } from './BaseRepository';
import { User } from '../entities/User';

interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'author' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function toDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class UserRepository extends BaseRepository {
  /**
   * 获取所有用户
   */
  static async getAllUsers(): Promise<UserDTO[]> {
    const repo = await this.getRepo(User);
    const users = await repo.find({ order: { createdAt: 'DESC' } });
    return users.map(toDTO);
  }

  /**
   * 分页获取用户
   */
  static async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PaginationResult<UserDTO>> {
    const { page = 1, limit = 10, search, role, status } = options;
    const repo = await this.getRepo(User);

    const qb = repo.createQueryBuilder('u')
      .orderBy('u.created_at', 'DESC');

    if (search) {
      qb.andWhere('(u.username ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
    }
    if (role && role !== 'all') {
      qb.andWhere('u.role = :role', { role });
    }
    if (status && status !== 'all') {
      qb.andWhere('u.status = :status', { status });
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users.map(toDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 通过ID获取用户
   */
  static async getUserById(id: number): Promise<UserDTO | null> {
    const repo = await this.getRepo(User);
    const user = await repo.findOne({ where: { id } });
    return user ? toDTO(user) : null;
  }

  /**
   * 通过用户名获取用户
   */
  static async getUserByUsername(username: string): Promise<UserDTO | null> {
    const repo = await this.getRepo(User);
    const user = await repo.findOne({ where: { username } });
    return user ? toDTO(user) : null;
  }

  /**
   * 通过邮箱获取用户
   */
  static async getUserByEmail(email: string): Promise<UserDTO | null> {
    const repo = await this.getRepo(User);
    const user = await repo.findOne({ where: { email } });
    return user ? toDTO(user) : null;
  }

  /**
   * 创建用户
   */
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }): Promise<UserDTO> {
    const repo = await this.getRepo(User);

    // 检查用户名是否已存在
    const existingUsername = await repo.findOne({ where: { username: data.username } });
    if (existingUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await repo.findOne({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error('邮箱已被使用');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = repo.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'user',
      status: data.status || 'active',
    });

    const saved = await repo.save(user);
    return toDTO(saved);
  }

  /**
   * 更新用户
   */
  static async updateUser(id: number, data: {
    username?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'author' | 'user';
    status?: 'active' | 'inactive' | 'suspended';
  }): Promise<UserDTO> {
    const repo = await this.getRepo(User);

    const user = await repo.findOne({ where: { id } });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户名唯一性
    if (data.username !== undefined) {
      const existing = await repo.createQueryBuilder('u')
        .where('u.username = :username', { username: data.username })
        .andWhere('u.id != :id', { id })
        .getOne();
      if (existing) throw new Error('用户名已存在');
      user.username = data.username;
    }

    // 检查邮箱唯一性
    if (data.email !== undefined) {
      const existing = await repo.createQueryBuilder('u')
        .where('u.email = :email', { email: data.email })
        .andWhere('u.id != :id', { id })
        .getOne();
      if (existing) throw new Error('邮箱已被使用');
      user.email = data.email;
    }

    if (data.password !== undefined) {
      user.password = await bcrypt.hash(data.password, 10);
    }
    if (data.role !== undefined) user.role = data.role;
    if (data.status !== undefined) user.status = data.status;

    const saved = await repo.save(user);
    return toDTO(saved);
  }

  /**
   * 删除用户
   */
  static async deleteUser(id: number): Promise<boolean> {
    const repo = await this.getRepo(User);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * 验证用户密码
   */
  static async validatePassword(username: string, password: string): Promise<boolean> {
    const repo = await this.getRepo(User);
    const user = await repo.findOne({ where: { username } });
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  /**
   * 获取用户文章数量
   */
  static async getUserPostCount(userId: number): Promise<number> {
    const ds = await this.getDataSource();
    const result = await ds.query(
      'SELECT COUNT(*) FROM posts WHERE author_id = $1',
      [userId]
    );
    return parseInt(result[0].count);
  }

  /**
   * 获取用户统计数据
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    authorUsers: number;
  }> {
    const ds = await this.getDataSource();
    const result = await ds.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'author') as author_users
      FROM users
    `);

    const row = result[0];
    return {
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
      adminUsers: parseInt(row.admin_users),
      authorUsers: parseInt(row.author_users),
    };
  }
}
