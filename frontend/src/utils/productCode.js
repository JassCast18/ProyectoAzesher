export function generateProductCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `PRD-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
