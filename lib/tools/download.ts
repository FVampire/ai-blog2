export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTextFile(text: string, filename: string, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type }), filename);
}
