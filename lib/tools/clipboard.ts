export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export async function copyRichHtml(html: string, plainText = '') {
  if (typeof ClipboardItem === 'undefined') return copyText(plainText || html);
  await navigator.clipboard.write([new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([plainText || html], { type: 'text/plain' }),
  })]);
}
