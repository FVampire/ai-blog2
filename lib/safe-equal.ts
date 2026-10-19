export function safeEqualBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index];
  }
  return result === 0;
}

export function safeEqualString(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  return safeEqualBytes(encoder.encode(left), encoder.encode(right));
}
