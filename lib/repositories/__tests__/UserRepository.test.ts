// UserRepository.test.ts
import { UserRepository } from '../UserRepository';

describe('UserRepository', () => {
  // 测试获取所有用户
  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const result = await UserRepository.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const user = result[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('status');
      }
    });
  });

  // 测试分页获取用户
  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const result = await UserRepository.getUsers({
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter users by search term', async () => {
      const result = await UserRepository.getUsers({
        page: 1,
        limit: 10,
        search: 'admin'
      });

      // 验证返回的用户包含搜索词
      if (result.data.length > 0) {
        const hasMatch = result.data.some(user =>
          user.username.includes('admin') ||
          user.email.includes('admin')
        );
        expect(hasMatch).toBe(true);
      }
    });

    it('should filter users by role', async () => {
      const result = await UserRepository.getUsers({
        page: 1,
        limit: 10,
        role: 'admin'
      });

      // 验证所有返回的用户角色都是admin
      result.data.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });
  });

  // 测试通过ID获取用户
  describe('getUserById', () => {
    it('should return null for non-existent user', async () => {
      const result = await UserRepository.getUserById(999999);
      expect(result).toBeNull();
    });
  });

  // 测试通过用户名获取用户
  describe('getUserByUsername', () => {
    it('should return null for non-existent username', async () => {
      const result = await UserRepository.getUserByUsername('nonexistentuser');
      expect(result).toBeNull();
    });
  });

  // 测试通过邮箱获取用户
  describe('getUserByEmail', () => {
    it('should return null for non-existent email', async () => {
      const result = await UserRepository.getUserByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  // 测试创建用户
  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        role: 'user' as const,
        status: 'active' as const
      };

      const result = await UserRepository.createUser(userData);

      expect(result).toHaveProperty('id');
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
      expect(result.role).toBe(userData.role);
      expect(result.status).toBe(userData.status);
      // 密码不应该被返回
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123'
      };

      // 先创建一个用户
      await UserRepository.createUser(userData);

      // 尝试再次创建相同用户名的用户，应该抛出错误
      await expect(UserRepository.createUser(userData))
        .rejects
        .toThrow('用户名已存在');
    });

    it('should throw error for duplicate email', async () => {
      const timestamp = Date.now();
      const userData1 = {
        username: 'testuser1' + timestamp,
        email: 'test' + timestamp + '@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'testuser2' + timestamp,
        email: 'test' + timestamp + '@example.com',
        password: 'password123'
      };

      // 先创建一个用户
      await UserRepository.createUser(userData1);

      // 尝试再次创建相同邮箱的用户，应该抛出错误
      await expect(UserRepository.createUser(userData2))
        .rejects
        .toThrow('邮箱已被使用');
    });
  });

  // 测试更新用户
  describe('updateUser', () => {
    it('should update user fields', async () => {
      // 先创建一个用户
      const userData = {
        username: 'originaluser' + Date.now(),
        email: 'original' + Date.now() + '@example.com',
        password: 'password123'
      };

      const createdUser = await UserRepository.createUser(userData);

      // 更新用户
      const updateData = {
        username: 'updateduser' + Date.now(),
        email: 'updated' + Date.now() + '@example.com'
      };

      const updatedUser = await UserRepository.updateUser(createdUser.id, updateData);

      expect(updatedUser.username).toBe(updateData.username);
      expect(updatedUser.email).toBe(updateData.email);
      // 确保其他字段没有被意外修改
      expect(updatedUser.role).toBe(createdUser.role);
      expect(updatedUser.status).toBe(createdUser.status);
    });

    it('should throw error for updating to duplicate username', async () => {
      const timestamp = Date.now();
      const userData1 = {
        username: 'user1' + timestamp,
        email: 'user1' + timestamp + '@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'user2' + timestamp,
        email: 'user2' + timestamp + '@example.com',
        password: 'password123'
      };

      // 创建两个用户
      const user1 = await UserRepository.createUser(userData1);
      const user2 = await UserRepository.createUser(userData2);

      // 尝试将user2的用户名更新为user1的用户名，应该抛出错误
      await expect(UserRepository.updateUser(user2.id, { username: user1.username }))
        .rejects
        .toThrow('用户名已存在');
    });

    it('should throw error for updating to duplicate email', async () => {
      const timestamp = Date.now();
      const userData1 = {
        username: 'user1' + timestamp,
        email: 'user1' + timestamp + '@example.com',
        password: 'password123'
      };

      const userData2 = {
        username: 'user2' + timestamp,
        email: 'user2' + timestamp + '@example.com',
        password: 'password123'
      };

      // 创建两个用户
      const user1 = await UserRepository.createUser(userData1);
      const user2 = await UserRepository.createUser(userData2);

      // 尝试将user2的邮箱更新为user1的邮箱，应该抛出错误
      await expect(UserRepository.updateUser(user2.id, { email: user1.email }))
        .rejects
        .toThrow('邮箱已被使用');
    });
  });

  // 测试删除用户
  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      // 先创建一个用户
      const userData = {
        username: 'todelete' + Date.now(),
        email: 'todelete' + Date.now() + '@example.com',
        password: 'password123'
      };

      const createdUser = await UserRepository.createUser(userData);

      // 删除用户
      const result = await UserRepository.deleteUser(createdUser.id);

      expect(result).toBe(true);

      // 验证用户确实被删除了
      const deletedUser = await UserRepository.getUserById(createdUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const result = await UserRepository.deleteUser(999999);
      expect(result).toBe(false);
    });
  });

  // 测试验证用户密码
  describe('validatePassword', () => {
    it('should return false for non-existent user', async () => {
      const result = await UserRepository.validatePassword('nonexistentuser', 'password');
      expect(result).toBe(false);
    });

    it('should validate correct password', async () => {
      const userData = {
        username: 'passwordtest' + Date.now(),
        email: 'passwordtest' + Date.now() + '@example.com',
        password: 'correctpassword'
      };

      // 创建用户
      await UserRepository.createUser(userData);

      // 验证密码
      const result = await UserRepository.validatePassword(userData.username, userData.password);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const userData = {
        username: 'passwordtest2' + Date.now(),
        email: 'passwordtest2' + Date.now() + '@example.com',
        password: 'correctpassword'
      };

      // 创建用户
      await UserRepository.createUser(userData);

      // 验证错误密码
      const result = await UserRepository.validatePassword(userData.username, 'wrongpassword');
      expect(result).toBe(false);
    });
  });

  // 测试获取用户统计数据
  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const result = await UserRepository.getUserStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('adminUsers');
      expect(result).toHaveProperty('authorUsers');
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.activeUsers).toBe('number');
      expect(typeof result.adminUsers).toBe('number');
      expect(typeof result.authorUsers).toBe('number');
    });
  });
});