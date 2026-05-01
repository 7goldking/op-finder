// Client-side image compression so phone photos (5–15 MB) upload quickly and don't time out.
// Resize the long edge to at most `maxEdge` and re-encode as JPEG with `quality`.
// Non-image files pass through untouched.

export async function compressImage(file, { maxEdge = 1920, quality = 0.85, maxBytes = 8 * 1024 * 1024 } = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('FileReader failed'));
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image decode failed'));
    i.src = dataUrl;
  });

  const longEdge = Math.max(img.width, img.height);
  const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  // Try progressive quality reduction if still too big
  let q = quality;
  let blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
  while (blob && blob.size > maxBytes && q > 0.4) {
    q -= 0.1;
    blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
  }
  if (!blob) return file;

  const ext = 'jpg';
  const base = (file.name || 'image').replace(/\.[a-z0-9]+$/i, '');
  return new File([blob], `${base}.${ext}`, { type: 'image/jpeg', lastModified: Date.now() });
}
