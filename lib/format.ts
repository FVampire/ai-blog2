const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(input: string | Date | null | undefined): string {
  if (input === null || input === undefined || input === '') return '';

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  return dateFormatter.format(date);
}
