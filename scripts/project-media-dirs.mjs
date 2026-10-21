// Case-study media served from COS instead of the app server. Paths are relative to public/.
// Embedded interactive builds (app/, viewer/, assets/) stay in public/ because they must be
// same-origin HTML, and COS default domains force HTML downloads.
// Keep in sync with .gitignore.
export const PROJECT_MEDIA_DIRS = [
  'projects/ai-interior-design/shots',
  'projects/ai-interior-design/renders',
  'projects/ai-interior-design/moodboard',
  'projects/wardrobe-lab/shots',
  'projects/wardrobe-lab/media',
  'projects/wardrobe-lab/lucy',
  'projects/moling/shots-r6',
  'projects/moling/video',
  'projects/ai-garment-pattern-agent/studio/shots-r5',
  'projects/ai-garment-pattern-agent/studio/video-r3',
];
