import { generateSlug, resolveTagIds } from '../agent-utils';
import { PostRepository } from '../repositories/PostRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { SeriesRepository } from '../repositories/SeriesRepository';
import { TagRepository } from '../repositories/TagRepository';
import { siteBaseUrl } from '../site-url';

const DEFAULT_AUTHOR_ID = parseInt(process.env.AGENT_AUTHOR_ID || '1', 10);

export interface AgentPublishInput {
  title: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  slug?: string;
  imageUrl?: string;
  projectSlug?: string;
  seriesSlug?: string;
}

export async function publishPostFromAgent(input: AgentPublishInput) {
  if (!input.title?.trim()) throw new Error('标题不能为空');

  const slug = input.slug?.trim() || generateSlug(input.title);
  const status = input.status || 'published';
  let tagIds: number[] = [];
  if (input.tags && input.tags.length > 0) {
    tagIds = await resolveTagIds(input.tags, TagRepository, (data) => TagRepository.createTag(data));
  }

  const post = await PostRepository.createPost({
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt || '',
    content: input.content || '',
    imageUrl: input.imageUrl || '',
    status,
    authorId: DEFAULT_AUTHOR_ID,
    tagIds,
  });

  if (input.projectSlug) {
    const project = await ProjectRepository.getProjectBySlugOrName(input.projectSlug);
    if (project) await ProjectRepository.linkPostBySlug(project.slug, post.id);
  }

  if (input.seriesSlug) {
    await SeriesRepository.appendPost(input.seriesSlug, post.id);
  }

  const postUrl = `/posts/${post.slug}`;
  return {
    post,
    url: postUrl,
    fullUrl: `${siteBaseUrl()}${postUrl}`,
  };
}

export { DEFAULT_AUTHOR_ID };
