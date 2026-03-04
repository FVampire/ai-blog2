// TagRepository.test.ts
import { TagRepository } from '../TagRepository';

describe('TagRepository', () => {
  // 测试获取所有标签
  describe('getAllTags', () => {
    it('should return all tags', async () => {
      const result = await TagRepository.getAllTags();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const tag = result[0];
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
      }
    });
  });

  // 测试分页获取标签
  describe('getTags', () => {
    it('should return paginated tags', async () => {
      const result = await TagRepository.getTags({
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

    it('should filter tags by search term', async () => {
      const result = await TagRepository.getTags({
        page: 1,
        limit: 10,
        search: '技术'
      });

      // 验证返回的标签包含搜索词
      if (result.data.length > 0) {
        const hasMatch = result.data.some(tag =>
          tag.name.includes('技术') ||
          tag.slug.includes('技术')
        );
        expect(hasMatch).toBe(true);
      }
    });
  });

  // 测试通过ID获取标签
  describe('getTagById', () => {
    it('should return null for non-existent tag', async () => {
      const result = await TagRepository.getTagById(999999);
      expect(result).toBeNull();
    });
  });

  // 测试通过slug获取标签
  describe('getTagBySlug', () => {
    it('should return null for non-existent slug', async () => {
      const result = await TagRepository.getTagBySlug('non-existent-slug');
      expect(result).toBeNull();
    });
  });

  // 测试创建标签
  describe('createTag', () => {
    it('should create a new tag', async () => {
      const tagData = {
        name: '测试标签' + Date.now(),
        slug: 'test-tag-' + Date.now()
      };

      const result = await TagRepository.createTag(tagData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(tagData.name);
      expect(result.slug).toBe(tagData.slug);
    });

    it('should throw error for duplicate tag name', async () => {
      const tagData = {
        name: '重复标签' + Date.now(),
        slug: 'duplicate-tag-' + Date.now()
      };

      // 先创建一个标签
      await TagRepository.createTag(tagData);

      // 尝试再次创建相同名称的标签，应该抛出错误
      await expect(TagRepository.createTag(tagData))
        .rejects
        .toThrow('标签名称或slug已存在');
    });

    it('should throw error for duplicate tag slug', async () => {
      const timestamp = Date.now();
      const tagData1 = {
        name: '标签1' + timestamp,
        slug: 'duplicate-slug-' + timestamp
      };

      const tagData2 = {
        name: '标签2' + timestamp,
        slug: 'duplicate-slug-' + timestamp
      };

      // 先创建一个标签
      await TagRepository.createTag(tagData1);

      // 尝试再次创建相同slug的标签，应该抛出错误
      await expect(TagRepository.createTag(tagData2))
        .rejects
        .toThrow('标签名称或slug已存在');
    });
  });

  // 测试更新标签
  describe('updateTag', () => {
    it('should update tag fields', async () => {
      // 先创建一个标签
      const tagData = {
        name: '原始标签' + Date.now(),
        slug: 'original-tag-' + Date.now()
      };

      const createdTag = await TagRepository.createTag(tagData);

      // 更新标签
      const updateData = {
        name: '更新标签' + Date.now(),
        slug: 'updated-tag-' + Date.now()
      };

      const updatedTag = await TagRepository.updateTag(createdTag.id, updateData);

      expect(updatedTag.name).toBe(updateData.name);
      expect(updatedTag.slug).toBe(updateData.slug);
    });

    it('should return existing tag when no updates provided', async () => {
      // 先创建一个标签
      const tagData = {
        name: '测试标签' + Date.now(),
        slug: 'test-tag-' + Date.now()
      };

      const createdTag = await TagRepository.createTag(tagData);

      // 不提供任何更新数据
      const updatedTag = await TagRepository.updateTag(createdTag.id, {});

      // 应该返回相同的标签数据
      expect(updatedTag.id).toBe(createdTag.id);
      expect(updatedTag.name).toBe(createdTag.name);
      expect(updatedTag.slug).toBe(createdTag.slug);
    });
  });

  // 测试删除标签
  describe('deleteTag', () => {
    it('should delete existing tag', async () => {
      // 先创建一个标签
      const tagData = {
        name: '待删除标签' + Date.now(),
        slug: 'to-delete-tag-' + Date.now()
      };

      const createdTag = await TagRepository.createTag(tagData);

      // 删除标签
      const result = await TagRepository.deleteTag(createdTag.id);

      expect(result).toBe(true);

      // 验证标签确实被删除了
      const deletedTag = await TagRepository.getTagById(createdTag.id);
      expect(deletedTag).toBeNull();
    });

    it('should return false for non-existent tag', async () => {
      const result = await TagRepository.deleteTag(999999);
      expect(result).toBe(false);
    });
  });

  // 测试获取热门标签
  describe('getPopularTags', () => {
    it('should return popular tags', async () => {
      const result = await TagRepository.getPopularTags(10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);

      // 验证返回的标签对象结构
      if (result.length > 0) {
        const tag = result[0];
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
      }
    });
  });

  // 测试获取标签文章数量
  describe('getTagPostCount', () => {
    it('should return zero for non-existent tag', async () => {
      const result = await TagRepository.getTagPostCount(999999);
      expect(result).toBe(0);
    });
  });
});