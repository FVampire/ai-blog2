import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import type { PluggableList } from 'unified';

/**
 * Allow GFM/highlight classes while still stripping scripts, event handlers, and javascript: URLs.
 * Always run after `rehypeRaw` so HTML in Markdown is parsed then filtered.
 */
export const markdownSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'id', 'className'],
    code: [...(defaultSchema.attributes?.code || []), 'className'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className'],
    span: [...(defaultSchema.attributes?.span || []), 'className'],
  },
  tagNames: [...(defaultSchema.tagNames || []), 'figure', 'figcaption'],
};

export const articleRehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, markdownSanitizeSchema],
  rehypeSlug,
  rehypeHighlight,
];

export const previewRehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, markdownSanitizeSchema],
  rehypeHighlight,
];
