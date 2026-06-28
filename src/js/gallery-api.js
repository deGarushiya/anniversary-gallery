const JSON_PATH = `${import.meta.env.BASE_URL}data/gallery.json`;

export async function loadGallery() {
  try {
    const res = await fetch('/api/gallery');
    if (res.ok) return res.json();
  } catch {
    /* local API not running */
  }

  const res = await fetch(JSON_PATH);
  return res.json();
}

export async function saveGallery(data) {
  const res = await fetch('/api/gallery', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Could not save — run npm run dev for local saves');
  return res.json();
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function uploadImage(galleryData, { section, file, monthId, highlightId, caption, date }) {
  if (!file) throw new Error('No file selected');

  const fd = new FormData();
  fd.append('image', file);
  fd.append('section', section);
  if (monthId) fd.append('folderId', monthId);
  if (monthId) fd.append('monthId', monthId);
  if (highlightId) fd.append('highlightId', highlightId);
  if (caption) fd.append('caption', caption);
  if (date) fd.append('date', date);

  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  const result = await res.json();
  return result.gallery;
}

export async function deleteImage(galleryData, { section, monthId, highlightId, imageId }) {
  const q = new URLSearchParams({ section, imageId });
  if (monthId) q.set('monthId', monthId);
  if (highlightId) q.set('highlightId', highlightId);
  const res = await fetch(`/api/images?${q}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function deleteMonth(galleryData, monthId) {
  const res = await fetch(`/api/months/${monthId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function addMonth(galleryData, { id, label }) {
  if (galleryData.months.some((m) => m.id === id)) throw new Error('Month already exists');
  galleryData.months.unshift({ id, label, images: [] });
  return saveGallery(galleryData);
}
