// PostRepository.test.ts
import { PostRepository } from '../PostRepository';

describe('PostRepository', () => {
  // 测试获取公开文章列表
  describe('getPublicPosts', () => {
    it('should return paginated public posts', async () => {
      const result = await PostRepository.getPublicPosts({
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

    it('should filter posts by search term', async () => {
      const result = await PostRepository.getPublicPosts({
        page: 1,
        limit: 10,
        search: '技术'
      });

      expect(result).toHaveProperty('data');
      // 验证返回的文章标题或内容包含搜索词
      if (result.data.length > 0) {
        const hasMatch = result.data.some(post =>
          post.title.includes('技术') ||
          (post.authorName && post.authorName.includes('技术'))
        );
        expect(hasMatch).toBe(true);
      }
    });
  });

  // 测试获取管理员文章列表
  describe('getAdminPosts', () => {
    it('should return paginated admin posts', async () => {
      const result = await PostRepository.getAdminPosts({
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

    it('should filter posts by status', async () => {
      const result = await PostRepository.getAdminPosts({
        page: 1,
        limit: 10,
        status: 'published'
      });

      // 验证所有返回的文章状态都是published
      result.data.forEach(post => {
        expect(post.status).toBe('published');
      });
    });
  });

  // 测试通过ID获取文章
  describe('getPostById', () => {
    it('should return null for non-existent post', async () => {
      const result = await PostRepository.getPostById(999999);
      expect(result).toBeNull();
    });

    it('should return post data for existing post', async () => {
      // 假设数据库中存在ID为1的文章
      const result = await PostRepository.getPostById(1);

      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('slug');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('authorId');
      }
    });
  });

  // 测试创建文章
  describe('createPost', () => {
    it('should create a new post', async () => {
      const postData = {
        title: '测试文章',
        slug: 'test-post-' + Date.now(),
        content: '这是一篇测试文章',
        status: 'draft' as const,
        authorId: 1
      };

      const result = await PostRepository.createPost(postData);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe(postData.title);
      expect(result.slug).toBe(postData.slug);
      expect(result.content).toBe(postData.content);
      expect(result.status).toBe(postData.status);
      expect(result.authorId).toBe(postData.authorId);
    });

    it('should throw error for duplicate slug', async () => {
      const postData = {
        title: '测试文章2',
        slug: 'test-post-' + Date.now(),
        content: '这是一篇测试文章2',
        status: 'draft' as const,
        authorId: 1
      };

      // 先创建一篇文章
      await PostRepository.createPost(postData);

      // 尝试再次创建相同slug的文章，应该抛出错误
      await expect(PostRepository.createPost(postData))
        .rejects
        .toThrow('Slug已存在');
    });
  });

  // 测试更新文章
  describe('updatePost', () => {
    it('should update post fields', async () => {
      // 先创建一篇文章
      const postData = {
        title: '原始标题',
        slug: 'original-slug-' + Date.now(),
        content: '原始内容',
        status: 'draft' as const,
        authorId: 1
      };

      const createdPost = await PostRepository.createPost(postData);

      // 更新文章
      const updateData = {
        title: '更新后的标题',
        status: 'published' as const
      };

      const updatedPost = await PostRepository.updatePost(createdPost.id, updateData);

      expect(updatedPost.title).toBe(updateData.title);
      expect(updatedPost.status).toBe(updateData.status);
      // 确保其他字段没有被意外修改
      expect(updatedPost.slug).toBe(createdPost.slug);
      expect(updatedPost.authorId).toBe(createdPost.authorId);
    });

    it('should return existing post when no updates provided', async () => {
      // 先创建一篇文章
      const postData = {
        title: '测试文章3',
        slug: 'test-post-3-' + Date.now(),
        content: '测试内容3',
        status: 'draft' as const,
        authorId: 1
      };

      const createdPost = await PostRepository.createPost(postData);

      // 不提供任何更新数据
      const updatedPost = await PostRepository.updatePost(createdPost.id, {});

      // 应该返回相同的文章数据
      expect(updatedPost.id).toBe(createdPost.id);
      expect(updatedPost.title).toBe(createdPost.title);
      expect(updatedPost.slug).toBe(createdPost.slug);
    });
  });

  // 测试删除文章
  describe('deletePost', () => {
    it('should delete existing post', async () => {
      // 先创建一篇文章
      const postData = {
        title: '待删除文章',
        slug: 'to-be-deleted-' + Date.now(),
        content: '这是一篇将被删除的文章',
        status: 'draft' as const,
        authorId: 1
      };

      const createdPost = await PostRepository.createPost(postData);

      // 删除文章
      const result = await PostRepository.deletePost(createdPost.id);

      expect(result).toBe(true);

      // 验证文章确实被删除了
      const deletedPost = await PostRepository.getPostById(createdPost.id);
      expect(deletedPost).toBeNull();
    });

    it('should return false for non-existent post', async () => {
      const result = await PostRepository.deletePost(999999);
      expect(result).toBe(false);
    });
  });

  // 测试获取热门文章
  describe('getPopularPosts', () => {
    it('should return popular posts', async () => {
      const result = await PostRepository.getPopularPosts(5);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);

      // 验证返回的文章对象结构
      if (result.length > 0) {
        const post = result[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('slug');
        expect(post).toHaveProperty('views');
      }
    });
  });

  // 测试搜索文章
  describe('searchPosts', () => {
    it('should return search results', async () => {
      const result = await PostRepository.searchPosts('测试', {
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
    });
  });
});