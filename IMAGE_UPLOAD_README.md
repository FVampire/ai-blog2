# 图片上传功能使用说明

## 功能概述

新增了图片上传功能，支持：
- ✅ 拖拽上传
- ✅ 点击上传
- ✅ 实时预览
- ✅ 上传进度显示
- ✅ 图片删除功能
- ✅ 文件大小限制（最大10MB）
- ✅ 文件类型验证（仅支持图片格式）

## 安装依赖

首先需要安装 formidable 依赖：

```bash
npm install
```

或者手动安装：

```bash
npm install formidable
npm install --save-dev @types/formidable
```

## 文件结构

```
├── pages/
│   ├── api/
│   │   └── upload.ts          # 图片上传API
│   └── upload-demo.tsx         # 演示页面
├── components/
│   └── ImageUpload.tsx         # 图片上传组件
├── public/
│   └── uploads/                # 上传的图片存储目录
└── styles/
    └── globals.css             # 包含图片上传组件样式
```

## 使用方法

### 1. 在你的页面中导入组件

```tsx
import ImageUpload from '../components/ImageUpload';
```

### 2. 使用组件

```tsx
function MyPage() {
  const [imageUrl, setImageUrl] = useState('');

  const handleUploadSuccess = (url: string) => {
    console.log('上传成功:', url);
    setImageUrl(url);
  };

  const handleUploadError = (error: string) => {
    console.error('上传失败:', error);
  };

  return (
    <ImageUpload
      onUploadSuccess={handleUploadSuccess}
      onUploadError={handleUploadError}
      defaultImage=""
      disabled={false}
    />
  );
}
```

## 组件参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| onUploadSuccess | `(imageUrl: string) => void` | 否 | - | 上传成功回调函数 |
| onUploadError | `(error: string) => void` | 否 | - | 上传失败回调函数 |
| defaultImage | `string` | 否 | `''` | 默认显示的图片URL |
| disabled | `boolean` | 否 | `false` | 是否禁用上传功能 |

## API 端点

### POST /api/upload

上传图片文件

**请求：**
- Content-Type: multipart/form-data
- Body: FormData with 'file' field

**响应：**
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "url": "/uploads/1234567890-abc123.jpg",
    "filename": "my-image.jpg",
    "size": 123456,
    "mimetype": "image/jpeg"
  }
}
```

## 演示页面

访问 `/upload-demo` 查看完整的演示页面：

```
http://localhost:3000/upload-demo
```

## 注意事项

1. **存储位置**: 图片默认存储在 `public/uploads/` 目录
2. **文件命名**: 上传的文件会自动重命名为时间戳+随机数的格式
3. **文件大小限制**: 最大 10MB
4. **支持的格式**: JPG, PNG, GIF 等图片格式
5. **生产环境**: 建议使用云存储服务（如 AWS S3、阿里云OSS）而不是本地存储

## 在后台管理中使用

可以在文章编辑页面中集成此组件：

```tsx
import ImageUpload from '../../components/ImageUpload';

function PostEditor() {
  const [post, setPost] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  return (
    <div>
      <input
        type="text"
        value={post.title}
        onChange={(e) => setPost({ ...post, title: e.target.value })}
        placeholder="标题"
      />

      <ImageUpload
        onUploadSuccess={(url) => setPost({ ...post, image_url: url })}
        defaultImage={post.image_url}
      />

      <textarea
        value={post.content}
        onChange={(e) => setPost({ ...post, content: e.target.value })}
        placeholder="内容"
      />
    </div>
  );
}
```

## 常见问题

### Q: 上传失败怎么办？
A: 检查以下几点：
1. 是否已安装 `formidable` 依赖
2. `public/uploads/` 目录是否存在且有写入权限
3. 文件大小是否超过 10MB
4. 文件格式是否正确

### Q: 如何更改文件大小限制？
A: 修改 `pages/api/upload.ts` 中的 `maxFileSize` 参数

### Q: 如何使用云存储？
A: 需要修改 `pages/api/upload.ts`，将文件上传到云存储服务并返回云存储的URL

## 下一步改进

- [ ] 支持多文件上传
- [ ] 图片裁剪功能
- [ ] 图片压缩优化
- [ ] 集成云存储服务
- [ ] 上传队列管理
