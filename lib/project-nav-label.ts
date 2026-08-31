export const DEFAULT_PROJECT_NAV_LABEL = '项目';

export function normalizeProjectNavLabel(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_PROJECT_NAV_LABEL;

  const label = value.trim();
  if (!label || label.toLowerCase() === 'projects') return DEFAULT_PROJECT_NAV_LABEL;

  return label;
}
