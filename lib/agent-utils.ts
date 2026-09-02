/**
 * Utilities for Agent API: slug generation, tag resolution, etc.
 */

import { resolveCanonicalTagName } from './tag-taxonomy';

export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

  if (slug) return slug;

  return `post-${Date.now()}`;
}

export async function resolveTagIds(
  tagNames: string[],
  tagRepo: { getAllTags: () => Promise<Array<{ id: number; name: string; slug: string }>> },
  createTag: (data: { name: string; slug: string }) => Promise<{ id: number }>
): Promise<number[]> {
  const existingTags = await tagRepo.getAllTags();
  const tagIds: number[] = [];
  const seen = new Set<number>();

  for (const rawName of tagNames) {
    const name = resolveCanonicalTagName(rawName);
    const slug = generateSlug(name);
    const found = existingTags.find(
      (t) => t.slug === slug || t.name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      if (seen.has(found.id)) continue;
      seen.add(found.id);
      tagIds.push(found.id);
      continue;
    }

    const newTag = await createTag({ name, slug });
    existingTags.push({ id: newTag.id, name, slug });
    seen.add(newTag.id);
    tagIds.push(newTag.id);
  }

  return tagIds;
}
