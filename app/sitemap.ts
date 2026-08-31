import type { MetadataRoute } from 'next';
import { PostRepository } from '@/lib/repositories/PostRepository';
import { ProjectRepository } from '@/lib/repositories/ProjectRepository';
import { TagRepository } from '@/lib/repositories/TagRepository';
import { getAvailableTools } from '@/lib/tools/registry';

export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/projects/forgetting-tide`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/projects/forgetting-tide/world`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/projects/forgetting-tide/story`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/projects/forgetting-tide/npcs`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/projects/forgetting-tide/play`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/tags`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...getAvailableTools().map((tool) => ({
      url: `${base}/tools/${tool.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: ['weather', 'markdown-to-html', 'mcp-explorer', 'js-playground'].includes(tool.slug) ? 0.75 : 0.6,
    })),
  ];

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const result = await PostRepository.getPublicPosts({ page: 1, limit: 1000 });
    postEntries = result.data.map((post) => ({
      url: `${base}/posts/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: failed to load posts', error);
  }

  let tagEntries: MetadataRoute.Sitemap = [];
  try {
    const tags = await TagRepository.getAllTagsWithCount();
    tagEntries = tags
      .filter((tag) => tag.postCount > 0)
      .map((tag) => ({
        url: `${base}/tags/${tag.slug}`,
        lastModified: tag.updatedAt ? new Date(tag.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }));
  } catch (error) {
    console.error('Sitemap: failed to load tags', error);
  }

  let projectEntries: MetadataRoute.Sitemap = [];
  try {
    const projects = await ProjectRepository.getAllProjects({ status: 'active' });
    projectEntries = projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: project.updatedAt ? new Date(project.updatedAt) : now,
      changeFrequency: 'monthly' as const,
      priority: project.featured ? 0.8 : 0.6,
    }));
  } catch (error) {
    console.error('Sitemap: failed to load projects', error);
  }

  const all = [...staticEntries, ...postEntries, ...tagEntries, ...projectEntries];
  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
