import { publishPostFromAgent } from '../agent/publish-post';
import { listDistributionJobs } from '../publish/jobs';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { PostRepository } from '../repositories/PostRepository';
import { SeriesRepository } from '../repositories/SeriesRepository';
import { siteBaseUrl } from '../site-url';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'search_posts',
    description: 'Search published blog posts by keyword. Returns title, slug, excerpt and URL.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword' },
        limit: { type: 'number', description: 'Max results, default 8' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_post',
    description: 'Read a post by slug or numeric id, including markdown body. Authenticated callers can read drafts.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        id: { type: 'number' },
      },
    },
  },
  {
    name: 'list_posts',
    description: 'List recent published posts.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        page: { type: 'number' },
      },
    },
  },
  {
    name: 'list_projects',
    description: 'List project showcases.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_project',
    description: 'Get one project by slug or name.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'list_series',
    description: 'List public article series with reading order.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_series',
    description: 'Get one series by slug, including ordered posts.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'publish_post',
    description: 'Create a blog post. Use status=draft unless the user explicitly asks to publish. After a published post is created, the server generates embeddings, fills excerpt/tags if missing, and fans out to configured channels.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string', description: 'Markdown body' },
        excerpt: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published'] },
        slug: { type: 'string' },
        imageUrl: { type: 'string' },
        projectSlug: { type: 'string' },
        seriesSlug: { type: 'string', description: 'Append this post to an existing or new series' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_distribution_jobs',
    description: 'List recent outbound distribution jobs (Telegram, Discord, WeChat, IndexNow, social copies).',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number' } },
    },
  },
];

function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

export async function callMcpTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'search_posts': {
      const query = String(args.query || '').trim();
      const limit = Math.min(20, Math.max(1, Number(args.limit) || 8));
      const posts = await PostRepository.searchPublishedLoose(query, limit);
      return textResult({
        query,
        posts: posts.map((post) => ({
          ...post,
          url: `${siteBaseUrl()}/posts/${post.slug}`,
        })),
      });
    }
    case 'get_post': {
      const id = Number(args.id);
      const slug = typeof args.slug === 'string' ? args.slug : '';
      const post = Number.isInteger(id) && id > 0
        ? await PostRepository.getPostById(id)
        : slug
          ? await PostRepository.getPostBySlugAnyStatus(slug)
          : null;
      if (!post) throw new Error('文章不存在');
      return textResult({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        seriesSlug: post.seriesSlug,
        url: `${siteBaseUrl()}/posts/${post.slug}`,
      });
    }
    case 'list_posts': {
      const limit = Math.min(30, Math.max(1, Number(args.limit) || 10));
      const page = Math.max(1, Number(args.page) || 1);
      const result = await PostRepository.getPublicPosts({ page, limit });
      return textResult({
        pagination: { page: result.page, total: result.total, totalPages: result.totalPages },
        posts: result.data.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          url: `${siteBaseUrl()}/posts/${post.slug}`,
        })),
      });
    }
    case 'list_projects': {
      const projects = await ProjectRepository.getAllProjects({ status: 'active' });
      return textResult(projects.map((project) => ({
        name: project.name,
        slug: project.slug,
        description: project.description,
        featured: project.featured,
        url: `${siteBaseUrl()}/projects/${project.slug}`,
      })));
    }
    case 'get_project': {
      const project = await ProjectRepository.getProjectBySlugOrName(String(args.slug || ''));
      if (!project) throw new Error('项目不存在');
      return textResult(project);
    }
    case 'list_series': {
      const series = await SeriesRepository.listPublic();
      return textResult(series.map((item) => ({
        title: item.title,
        slug: item.slug,
        description: item.description,
        publishedCount: item.publishedCount,
        totalCount: item.totalCount,
        url: `${siteBaseUrl()}/series/${item.slug}`,
      })));
    }
    case 'get_series': {
      const series = await SeriesRepository.getBySlug(String(args.slug || ''));
      if (!series) throw new Error('系列不存在');
      return textResult({
        ...series,
        url: `${siteBaseUrl()}/series/${series.slug}`,
      });
    }
    case 'publish_post': {
      const result = await publishPostFromAgent({
        title: String(args.title || ''),
        content: typeof args.content === 'string' ? args.content : '',
        excerpt: typeof args.excerpt === 'string' ? args.excerpt : '',
        tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
        status: args.status === 'published' ? 'published' : 'draft',
        slug: typeof args.slug === 'string' ? args.slug : undefined,
        imageUrl: typeof args.imageUrl === 'string' ? args.imageUrl : undefined,
        projectSlug: typeof args.projectSlug === 'string' ? args.projectSlug : undefined,
        seriesSlug: typeof args.seriesSlug === 'string' ? args.seriesSlug : undefined,
      });
      if (result.post.status === 'published') {
        const { schedulePublishPipeline } = await import('../publish/pipeline');
        schedulePublishPipeline(result.post.id, { previousStatus: 'draft' });
      }
      return textResult({
        id: result.post.id,
        slug: result.post.slug,
        status: result.post.status,
        url: result.url,
        fullUrl: result.fullUrl,
      });
    }
    case 'list_distribution_jobs': {
      const jobs = await listDistributionJobs(Math.min(50, Math.max(1, Number(args.limit) || 20)));
      return textResult(jobs);
    }
    default:
      throw new Error(`未知工具：${name}`);
  }
}
