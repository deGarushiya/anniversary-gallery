import { getSupabase, isSupabaseConfigured } from './supabase-app.js';

const JSON_PATH = `${import.meta.env.BASE_URL}data/gallery.json`;
const GALLERY_ID = 'main';
const BUCKET = 'images';

export function usesSupabase() {
  return isSupabaseConfigured();
}

export async function loadGallery() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('gallery')
      .select('data')
      .eq('id', GALLERY_ID)
      .maybeSingle();

    if (error) throw error;
    if (data?.data) return data.data;

    const res = await fetch(JSON_PATH);
    const seed = await res.json();
    const { error: seedError } = await supabase
      .from('gallery')
      .upsert({ id: GALLERY_ID, data: seed });
    if (seedError) throw seedError;
    return seed;
  }

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('gallery')
      .upsert({ id: GALLERY_ID, data });
    if (error) throw error;
    return data;
  }

  const res = await fetch('/api/gallery', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Could not save — run npm run dev for local saves');
  return res.json();
}

function safeName(file) {
  const ext = file.name.split('.').pop();
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  return `${base}-${Date.now()}.${ext}`;
}

function storagePathFromUrl(url) {
  if (!url || !url.includes('supabase.co/storage')) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function uploadFile(file, storagePath) {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function deleteStorageUrl(url) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  const supabase = getSupabase();
  await supabase.storage.from(BUCKET).remove([path]);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function uploadImage(galleryData, { section, file, monthId, highlightId, caption, date }) {
  if (!file) throw new Error('No file selected');

  if (isSupabaseConfigured()) {
    let storagePath;
    if (section === 'months') storagePath = `months/${monthId}/${safeName(file)}`;
    else if (section === 'featured') storagePath = `featured/${safeName(file)}`;
    else if (section === 'wedding') storagePath = `wedding/${safeName(file)}`;
    else if (section === 'then' || section === 'now') storagePath = `${section}/${safeName(file)}`;
    else if (section === 'highlights') storagePath = `highlights/${highlightId}/${safeName(file)}`;
    else throw new Error('Unknown section');

    const src = await uploadFile(file, storagePath);
    const image = {
      id: uid('img'),
      src,
      caption: caption || '',
      date: date || new Date().toISOString().split('T')[0],
    };

    if (section === 'months') {
      const month = galleryData.months.find((m) => m.id === monthId);
      if (!month) throw new Error('Month not found');
      month.images.unshift(image);
    } else if (section === 'featured') {
      if (galleryData.featuredPhoto?.src) await deleteStorageUrl(galleryData.featuredPhoto.src);
      galleryData.featuredPhoto = {
        ...galleryData.featuredPhoto,
        src,
        caption: caption || galleryData.featuredPhoto?.caption || '',
      };
    } else if (section === 'wedding') {
      if (!galleryData.weddingDay) galleryData.weddingDay = { title: '', subtitle: '', images: [] };
      galleryData.weddingDay.images.unshift(image);
    } else if (section === 'then' || section === 'now') {
      if (!galleryData.thenAndNow) galleryData.thenAndNow = {};
      if (galleryData.thenAndNow[section]?.src) await deleteStorageUrl(galleryData.thenAndNow[section].src);
      galleryData.thenAndNow[section] = { src, caption: caption || '' };
    } else if (section === 'highlights') {
      const hl = galleryData.yearHighlights.find((y) => y.id === highlightId);
      if (!hl) throw new Error('Chapter not found');
      hl.photos.unshift({ id: image.id, src: image.src, caption: image.caption });
    }

    return saveGallery(galleryData);
  }

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
  if (isSupabaseConfigured()) {
    if (section === 'months') {
      const month = galleryData.months.find((m) => m.id === monthId);
      const idx = month?.images.findIndex((i) => i.id === imageId);
      if (idx === -1) throw new Error('Image not found');
      await deleteStorageUrl(month.images[idx].src);
      month.images.splice(idx, 1);
    } else if (section === 'wedding') {
      const idx = galleryData.weddingDay.images.findIndex((i) => i.id === imageId);
      if (idx === -1) throw new Error('Image not found');
      await deleteStorageUrl(galleryData.weddingDay.images[idx].src);
      galleryData.weddingDay.images.splice(idx, 1);
    } else if (section === 'highlights') {
      const hl = galleryData.yearHighlights.find((y) => y.id === highlightId);
      const idx = hl?.photos.findIndex((i) => i.id === imageId);
      if (idx === -1) throw new Error('Image not found');
      await deleteStorageUrl(hl.photos[idx].src);
      hl.photos.splice(idx, 1);
    }
    return saveGallery(galleryData);
  }

  const q = new URLSearchParams({ section, imageId });
  if (monthId) q.set('monthId', monthId);
  if (highlightId) q.set('highlightId', highlightId);
  const res = await fetch(`/api/images?${q}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function deleteMonth(galleryData, monthId) {
  if (isSupabaseConfigured()) {
    const month = galleryData.months.find((m) => m.id === monthId);
    if (month) {
      for (const img of month.images) await deleteStorageUrl(img.src);
    }
    galleryData.months = galleryData.months.filter((m) => m.id !== monthId);
    return saveGallery(galleryData);
  }

  const res = await fetch(`/api/months/${monthId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function addMonth(galleryData, { id, label }) {
  if (galleryData.months.some((m) => m.id === id)) throw new Error('Month already exists');
  galleryData.months.unshift({ id, label, images: [] });
  return saveGallery(galleryData);
}
