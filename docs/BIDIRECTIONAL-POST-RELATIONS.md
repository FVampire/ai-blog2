# 文章前后关系双向同步说明

## 功能概述

当设置文章的"上一篇"或"下一篇"时，系统会自动同步更新被关联文章的对应关系，实现真正的双向绑定。

## 工作原理

### 示例场景

假设有三篇文章：A、B、C

**操作**：编辑文章 B，设置：
- 上一篇：文章 A
- 下一篇：文章 C

**系统自动执行**：

1. 更新文章 B：
   - `prev_post_id = A`
   - `next_post_id = C`

2. 自动同步文章 A：
   - `next_post_id = B`（因为 B 的上一篇是 A）

3. 自动同步文章 C：
   - `prev_post_id = B`（因为 B 的下一篇是 C）

## 处理旧关系

系统会智能处理旧的关联关系：

### 场景 1：更改上一篇

**初始状态**：
- 文章 B：`prev_post_id = D`
- 文章 D：`next_post_id = B`

**操作**：将 B 的上一篇改为 A

**系统执行**：
1. 清除文章 D 的 `next_post_id`（因为不再指向 B）
2. 设置文章 B 的 `prev_post_id = A`
3. 设置文章 A 的 `next_post_id = B`

### 场景 2：取消关联

**操作**：将 B 的上一篇设置为"无"

**系统执行**：
1. 清除旧上一篇文章的 `next_post_id`
2. 设置文章 B 的 `prev_post_id = NULL`

## 数据库更新流程

```
1. 查询当前文章的旧关联
   SELECT prev_post_id, next_post_id FROM posts WHERE id = B

2. 开启事务
   BEGIN

3. 更新当前文章
   UPDATE posts SET prev_post_id = A, next_post_id = C WHERE id = B

4. 清除旧关联（如果存在）
   UPDATE posts SET next_post_id = NULL
   WHERE id = old_prev_id AND next_post_id = B

5. 设置新关联
   UPDATE posts SET next_post_id = B WHERE id = A
   UPDATE posts SET prev_post_id = B WHERE id = C

6. 提交事务
   COMMIT
```

## 优势

### 1. 数据一致性
- 双向关系始终保持同步
- 避免单向引用导致的数据不一致

### 2. 自动维护
- 无需手动在两篇文章中分别设置
- 减少操作步骤和出错可能

### 3. 智能清理
- 自动清除过期的关联关系
- 保持数据库的整洁

## 日志监控

系统会在服务器日志中输出详细的同步信息：

```
🔗 [PUT /api/posts/:id] Syncing bidirectional relations: {
  currentPostId: "2",
  oldPrevId: null,
  oldNextId: null,
  newPrevId: 1,
  newNextId: 3
}
  ✓ Set new prev post (1) next_post_id to 2
  ✓ Set new next post (3) prev_post_id to 2
```

## 使用建议

### 1. 创建文章系列

**推荐做法**：按顺序设置
1. 编辑第 1 篇，设置下一篇 = 第 2 篇
2. 编辑第 2 篇，设置下一篇 = 第 3 篇（上一篇已自动设置为第 1 篇）
3. 编辑第 3 篇（前后关系已自动设置）

### 2. 修改关系

直接编辑任何一篇文章，修改其前后关系，系统会自动处理所有关联文章。

### 3. 验证关系

```sql
-- 查看所有文章的关联关系
SELECT
  id,
  title,
  prev_post_id,
  next_post_id,
  (SELECT title FROM posts WHERE id = p.prev_post_id) as prev_title,
  (SELECT title FROM posts WHERE id = p.next_post_id) as next_title
FROM posts p
ORDER BY id;
```

## 注意事项

1. **事务保护**：所有同步操作在一个事务中完成，要么全部成功，要么全部回滚
2. **只更新已发布文章**：编辑页面只显示已发布的文章供选择
3. **循环引用检测**：虽然系统允许设置，但应避免创建循环引用（A → B → A）
4. **性能考虑**：每次更新最多产生 4 个额外的 UPDATE 查询，在事务中执行，性能影响微小

## 实现细节

文件：`pages/api/posts/[id].ts`

关键代码段：
- 查询旧关联：第 91-99 行
- 双向同步逻辑：第 218-277 行
- 事务提交：第 279 行

## 故障排除

如果发现关联关系不一致：

1. 检查服务器日志是否有同步日志
2. 查询数据库验证实际数据
3. 手动修正数据（见"验证关系"SQL）
4. 重新通过编辑页面设置关系

## 未来改进

可能的增强功能：
- 循环引用检测和警告
- 批量设置系列关系
- 可视化文章关系图
- 关系变更历史记录
