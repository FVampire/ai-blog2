# 文章前后关系功能故障排除指南

## 问题：上一篇文章和下一篇文章的关联关系没有正常保存

## 诊断步骤

### 1. 确认数据库迁移已执行

首先确认 `prev_post_id` 和 `next_post_id` 字段已添加到数据库：

```bash
# 连接到你的 PostgreSQL 数据库
psql -U your_username -d your_database_name

# 运行检查查询
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('prev_post_id', 'next_post_id')
ORDER BY column_name;
```

**预期结果**：应该看到两行，显示这两个字段存在。

**如果字段不存在**，运行迁移：

```bash
psql -U your_username -d your_database_name -f db/migration-add-post-relations.sql
```

### 2. 查看浏览器控制台日志

打开浏览器开发者工具（F12），进入 Console 标签页：

#### 编辑文章时，应该看到：
```
📤 [Edit Post] Submitting form data: {
  id: "1",
  prevPostId: 2,
  nextPostId: 3,
  title: "文章标题"
}
```

#### 服务器端日志（查看终端），应该看到：
```
📝 [PUT /api/posts/:id] Received data: {
  id: "1",
  prevPostId: 2,
  nextPostId: 3,
  hasTitle: true,
  hasContent: true
}

🔄 [PUT /api/posts/:id] Executing SQL: {
  query: "UPDATE posts SET ... prev_post_id = $1, next_post_id = $2 ...",
  values: [...],
  fieldsCount: ...
}
```

### 3. 常见问题和解决方案

#### 问题 A：字段未发送（prevPostId 和 nextPostId 为 undefined）

**原因**：表单数据未包含这些字段。

**解决**：确保编辑页面的 formData 包含这些字段：
```typescript
const [formData, setFormData] = useState({
  // ... 其他字段
  prevPostId: null as number | null,
  nextPostId: null as number | null,
});
```

#### 问题 B：数据库字段不存在

**错误信息**：`column "prev_post_id" does not exist`

**解决**：运行数据库迁移（见步骤 1）

#### 问题 C：选择器显示为空

**原因**：API 返回的文章列表为空。

**解决**：
1. 检查是否有已发布的文章
2. 查看浏览器 Network 标签中 `/api/posts?limit=100` 的响应

### 4. 手动验证数据

连接数据库后，运行：

```sql
-- 查看某篇文章的前后关系
SELECT id, title, prev_post_id, next_post_id
FROM posts
WHERE id = 1;

-- 手动设置前后关系（测试）
UPDATE posts
SET prev_post_id = 2, next_post_id = 3
WHERE id = 1;
```

### 5. 完整测试流程

1. 创建 3 篇已发布的测试文章
2. 编辑第 2 篇文章
3. 设置：
   - 上一篇：第 1 篇文章
   - 下一篇：第 3 篇文章
4. 保存
5. 访问第 2 篇文章的详情页
6. 确认底部显示"上一篇"和"下一篇"导航按钮

### 6. 如果问题仍然存在

检查以下内容并提供信息：

1. **浏览器控制台日志**：复制所有包含 [Edit Post] 的日志
2. **服务器日志**：复制包含 [PUT /api/posts/:id] 的日志
3. **数据库查询结果**：
   ```sql
   SELECT id, title, prev_post_id, next_post_id FROM posts LIMIT 5;
   ```
4. **Network 请求详情**：
   - 请求 URL
   - 请求 Body
   - 响应内容

## 快速修复脚本

如果需要手动设置文章关系，可以运行：

```sql
-- 示例：创建文章系列关系
-- 假设你有文章 ID: 1, 2, 3

-- 第 1 篇（无上一篇，下一篇是 2）
UPDATE posts SET prev_post_id = NULL, next_post_id = 2 WHERE id = 1;

-- 第 2 篇（上一篇是 1，下一篇是 3）
UPDATE posts SET prev_post_id = 1, next_post_id = 3 WHERE id = 2;

-- 第 3 篇（上一篇是 2，无下一篇）
UPDATE posts SET prev_post_id = 2, next_post_id = NULL WHERE id = 3;
```

## 预期效果

保存成功后：
- 数据库中 `prev_post_id` 和 `next_post_id` 字段应该有值
- 文章详情页底部显示导航按钮
- 点击导航按钮可以跳转到对应的文章
