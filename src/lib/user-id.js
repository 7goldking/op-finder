/**
 * Generates a unique user ID from email
 * Format: 8 alphanumeric characters (uppercase)
 */
export function generateUserID(email) {
  const hash = email.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  let num = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    id = chars[num % 36] + id;
    num = Math.floor(num / 36);
  }
  return id;
}