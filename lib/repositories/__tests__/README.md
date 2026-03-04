# Repository 测试

这个目录包含了所有Repository类的单元测试。

## 测试结构

```
__tests__/
├── PostRepository.test.ts     # 文章Repository测试
├── TagRepository.test.ts      # 标签Repository测试
├── UserRepository.test.ts     # 用户Repository测试
└── README.md                 # 测试说明文档
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试文件
```bash
npm test PostRepository.test.ts
npm test TagRepository.test.ts
npm test UserRepository.test.ts
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

## 测试策略

### 1. 功能测试
- 测试每个Repository方法的基本功能
- 验证正确输入时的返回值
- 验证错误输入时的异常处理

### 2. 边界测试
- 测试空数据集的情况
- 测试不存在的记录
- 测试分页边界条件

### 3. 数据一致性测试
- 测试创建、读取、更新、删除操作的一致性
- 验证关联数据的正确处理
- 测试事务处理的正确性

### 4. 错误处理测试
- 测试重复数据的处理
- 验证约束违反的情况
- 测试数据库连接错误的处理

## 测试环境配置

测试需要以下环境变量：

```env
# 数据库连接
DATABASE_URL=your_test_database_url
DATABASE_TYPE=postgresql

# 测试环境
NODE_ENV=test
```

## 测试数据管理

### 测试数据隔离
- 每个测试使用唯一的测试数据（通过时间戳等方式）
- 测试结束后清理创建的测试数据
- 使用事务回滚来避免数据污染

### 测试数据示例
```typescript
// 创建测试用的唯一数据
const testData = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  slug: 'test-slug-' + Date.now()
};
```

## 测试覆盖率目标

- **行覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 85%
- **分支覆盖率**: ≥ 75%

## 持续集成

测试会在以下情况下自动运行：
1. 提交代码到版本控制系统
2. 创建Pull Request
3. 部署到测试环境

## 最佳实践

### 1. 测试命名
使用清晰的描述性命名：
```typescript
it('should return null for non-existent user', async () => {
  // 测试代码
});
```

### 2. 测试隔离
确保每个测试独立运行，不依赖其他测试的结果。

### 3. 断言明确
使用具体的断言来验证预期结果：
```typescript
expect(result).toHaveProperty('id');
expect(result.username).toBe('expected_username');
```

### 4. 异常测试
验证异常情况的处理：
```typescript
await expect(UserRepository.createUser(duplicateData))
  .rejects
  .toThrow('用户名已存在');
```

## 常见问题

### 1. 测试数据库连接失败
确保测试环境变量正确配置，测试数据库可访问。

### 2. 测试数据冲突
确保每个测试使用唯一的测试数据，避免数据冲突。

### 3. 测试运行缓慢
可以并行运行测试，或优化测试数据的创建和清理过程。