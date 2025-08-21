export function bufferToBase64Url(buffer: Buffer | ArrayBuffer) {
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
export function base64UrlToBuffer(base64url: string) {
  base64url = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64url.length % 4) base64url += '=';
  return Buffer.from(base64url, 'base64');
}
