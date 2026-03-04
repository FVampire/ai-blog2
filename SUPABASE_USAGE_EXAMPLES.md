# Supabase 使用示例

本文档展示了如何在 Supabase 模式下使用数据库适配器。

## 配置

首先，确保在 `.env` 文件中设置以下环境变量：

```
DATABASE_TYPE=supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 在 API 路由中使用

### 基本用法

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db-adapter';

export async function GET(request: NextRequest) {
  try {
    // 为 Supabase 模式创建数据库适配器
    const dbAdapter = createDatabaseAdapter(request, NextResponse.next());

    // 获取包含 Supabase 客户端的客户端对象
    const client = await dbAdapter.getClient();

    // 获取 Supabase 客户端实例
    const supabase = (client as any).supabase;

    // 使用 Supabase 客户端查询数据
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published');

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
```

### 创建新记录

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 创建数据库适配器
    const dbAdapter = createDatabaseAdapter(request, NextResponse.next());
    const client = await dbabase.getClient();
    const supabase = (client as any).supabase;

    // 插入数据
    const { data, error } = await supabase
      .from('posts')
      .insert([body])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
```

## 在服务器组件中使用

```typescript
import { createDatabaseAdapter } from '@/lib/db-adapter';

// 在服务器组件中，不需要传递 request/response
export default async function ServerComponent() {
  // 创建数据库适配器（无请求上下文）
  const dbAdapter = createDatabaseAdapter();
  const client = await dbAdapter.getClient();
  const supabase = (client as any).supabase;

  // 查询数据
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published');

  if (error) {
    console.error('Error fetching posts:', error);
    return <div>Error loading posts</div>;
  }

  return (
    <div>
      {data.map((post: any) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}
```

## 注意事项

1. **不支持原始 SQL 查询**：在 Supabase 模式下，不能使用 `query()` 方法执行原始 SQL 查询。必须使用 Supabase 客户端提供的方法。

2. **客户端访问**：可以通过 `getClient()` 返回对象的 `supabase` 属性访问 Supabase 客户端实例。

3. **Cookie 管理**：当传递 `request` 和 `response` 对象时，适配器会自动处理 cookie 管理，这对于身份验证非常重要。

4. **环境变量**：确保正确设置 Supabase 环境变量，否则客户端初始化会失败。

5. **错误处理**：Supabase 客户端返回的错误对象包含详细的错误信息，应该适当处理这些错误。