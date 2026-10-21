const ORIGIN = (process.env.NEXT_PUBLIC_PROJECT_MEDIA_ORIGIN || '').replace(/\/+$/, '');

/** Resolves a `/projects/...` media path to COS when configured, otherwise to public/. */
export function projectMedia(path: string): string {
  return `${ORIGIN}${path}`;
}
