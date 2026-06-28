const SESSION_KEY = 'gallery-admin-auth';

if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
  window.location.replace('/admin.html');
}

const toast = document.getElementById('toast');
let galleryData = null;

function uid(p = 'id') {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function showToast(msg, err = false) {
  toast.textContent = msg;
  toast.className = err ? 'toast toast--error' : 'toast';
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3000);
}

async function uploadImage(formData) {
  return api('/upload', { method: 'POST', body: formData });
}

function initTabs() {
  document.querySelectorAll('.sidebar__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar__btn').forEach((b) => b.classList.remove('sidebar__btn--active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('tab-panel--active'));
      btn.classList.add('sidebar__btn--active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('tab-panel--active');
    });
  });
}

async function loadGallery() {
  try {
    galleryData = await api('/gallery');
  } catch {
    const res = await fetch('/data/gallery.json');
    galleryData = await res.json();
    showToast('Read-only mode — run npm run dev for full admin', true);
  }
  populateAll();
}

function populateAll() {
  document.getElementById('setting-title').value = galleryData.title || '';
  document.getElementById('setting-subtitle').value = galleryData.subtitle || '';
  document.getElementById('setting-wedding').value = galleryData.weddingDate || '';
  document.getElementById('setting-together').value = galleryData.togetherSince || '';
  document.getElementById('featured-caption').value = galleryData.featuredPhoto?.caption || '';
  if (galleryData.featuredPhoto?.src) {
    document.getElementById('featured-preview').innerHTML = `<img src="${galleryData.featuredPhoto.src}" alt="" />`;
  }
  document.getElementById('then-caption').value = galleryData.thenAndNow?.then?.caption || '';
  document.getElementById('now-caption').value = galleryData.thenAndNow?.now?.caption || '';
  if (galleryData.thenAndNow?.then?.src) document.getElementById('then-preview').innerHTML = `<img src="${galleryData.thenAndNow.then.src}" alt="" />`;
  if (galleryData.thenAndNow?.now?.src) document.getElementById('now-preview').innerHTML = `<img src="${galleryData.thenAndNow.now.src}" alt="" />`;
  document.getElementById('wedding-title').value = galleryData.weddingDay?.title || '';
  document.getElementById('wedding-subtitle').value = galleryData.weddingDay?.subtitle || '';
  document.getElementById('letter-title').value = galleryData.loveLetter?.title || '';
  document.getElementById('letter-content').value = galleryData.loveLetter?.content || '';
  document.getElementById('song-title').value = galleryData.ourSong?.title || '';
  document.getElementById('song-artist').value = galleryData.ourSong?.artist || '';
  document.getElementById('song-url').value = galleryData.ourSong?.url || '';
  document.getElementById('site-password').value = galleryData.sitePassword || '';

  renderTimelineList();
  renderQuotesList();
  renderPlacesList();
  renderMessagesList();
  renderVideosList();
  renderWeddingList();
  renderHighlightsAdmin();
  renderGalleryAdmin();
}

/* ── Settings ── */
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    galleryData = await api('/gallery/meta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('setting-title').value,
        subtitle: document.getElementById('setting-subtitle').value,
        weddingDate: document.getElementById('setting-wedding').value,
        togetherSince: document.getElementById('setting-together').value,
      }),
    });
    showToast('Settings saved');
  } catch (err) { showToast(err.message, true); }
});

/* ── Featured ── */
document.getElementById('featured-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('featured-file').files[0];
  const fd = new FormData();
  fd.append('section', 'featured');
  fd.append('caption', document.getElementById('featured-caption').value);
  if (file) fd.append('image', file);
  else if (!galleryData.featuredPhoto?.src) { showToast('Select an image', true); return; }
  try {
    if (file) {
      galleryData = (await uploadImage(fd)).gallery;
    } else {
      galleryData = await api('/gallery/meta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredPhoto: { ...galleryData.featuredPhoto, caption: document.getElementById('featured-caption').value } }),
      });
    }
    populateAll();
    showToast('Featured photo saved');
  } catch (err) { showToast(err.message, true); }
});

/* ── Timeline ── */
function renderTimelineList() {
  const el = document.getElementById('timeline-list');
  const items = galleryData.timeline || [];
  el.innerHTML = items.map((item, i) => `
    <div class="admin-item" data-idx="${i}">
      <div class="admin-item__body">
        <p class="admin-item__title">${item.title} ${item.upcoming ? '(upcoming)' : ''}</p>
        <p class="admin-item__meta">${item.date} — ${item.description}</p>
      </div>
      <button class="btn btn--danger btn--sm" data-del-tl="${i}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-tl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      galleryData.timeline.splice(+btn.dataset.delTl, 1);
      renderTimelineList();
    });
  });
}

document.getElementById('timeline-add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!galleryData.timeline) galleryData.timeline = [];
  galleryData.timeline.push({
    id: uid('tl'),
    date: document.getElementById('tl-date').value,
    title: document.getElementById('tl-title').value,
    description: document.getElementById('tl-desc').value,
    image: '',
    upcoming: document.getElementById('tl-upcoming').checked,
  });
  document.getElementById('timeline-add-form').reset();
  renderTimelineList();
});

document.getElementById('timeline-save').addEventListener('click', async () => {
  try {
    galleryData = await api('/gallery/section/timeline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: galleryData.timeline }),
    });
    showToast('Timeline saved');
  } catch (err) { showToast(err.message, true); }
});

/* ── Then & Now ── */
async function saveThenNow(side, fileId, captionId, previewId) {
  const file = document.getElementById(fileId).files[0];
  const fd = new FormData();
  fd.append('section', side);
  fd.append('caption', document.getElementById(captionId).value);
  if (file) {
    fd.append('image', file);
    galleryData = (await uploadImage(fd)).gallery;
  } else {
    galleryData = await api('/gallery/meta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thenAndNow: {
          ...galleryData.thenAndNow,
          [side]: { ...galleryData.thenAndNow?.[side], caption: document.getElementById(captionId).value },
        },
      }),
    });
  }
  populateAll();
  showToast(`${side === 'then' ? 'Then' : 'Now'} saved`);
}

document.getElementById('then-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await saveThenNow('then', 'then-file', 'then-caption', 'then-preview'); }
  catch (err) { showToast(err.message, true); }
});

document.getElementById('now-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await saveThenNow('now', 'now-file', 'now-caption', 'now-preview'); }
  catch (err) { showToast(err.message, true); }
});

/* ── Wedding ── */
document.getElementById('wedding-meta-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    galleryData = await api('/gallery/meta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weddingDay: {
          ...galleryData.weddingDay,
          title: document.getElementById('wedding-title').value,
          subtitle: document.getElementById('wedding-subtitle').value,
        },
      }),
    });
    showToast('Wedding section saved');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('wedding-upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('wedding-file').files[0];
  if (!file) { showToast('Select a photo', true); return; }
  const fd = new FormData();
  fd.append('section', 'wedding');
  fd.append('caption', document.getElementById('wedding-caption').value);
  fd.append('date', document.getElementById('wedding-date').value);
  fd.append('image', file);
  try {
    galleryData = (await uploadImage(fd)).gallery;
    document.getElementById('wedding-upload-form').reset();
    renderWeddingList();
    showToast('Wedding photo uploaded');
  } catch (err) { showToast(err.message, true); }
});

function renderWeddingList() {
  const el = document.getElementById('wedding-list');
  const imgs = galleryData.weddingDay?.images || [];
  el.innerHTML = imgs.map((img) => `
    <div class="admin-item">
      <img src="${img.src}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
      <div class="admin-item__body"><p class="admin-item__title">${img.caption || 'No caption'}</p></div>
      <button class="btn btn--danger btn--sm" data-del-wd="${img.id}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-wd]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete?')) return;
      try {
        galleryData = await api(`/images?section=wedding&imageId=${btn.dataset.delWd}`, { method: 'DELETE' });
        renderWeddingList();
        showToast('Deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });
}

/* ── Highlights ── */
function renderHighlightsAdmin() {
  const el = document.getElementById('highlights-admin');
  el.innerHTML = (galleryData.yearHighlights || []).map((block) => `
    <div class="highlight-admin-block" data-hl="${block.id}">
      <div class="highlight-admin-block__head">
        <strong>${block.label}</strong>
        <button class="btn btn--danger btn--sm" data-del-hl="${block.id}">Delete Chapter</button>
      </div>
      <form class="hl-upload-form" data-hl-id="${block.id}">
        <label class="field"><span>Caption</span><input type="text" class="input hl-caption" /></label>
        <label class="field"><span>Photo</span><input type="file" accept="image/*" class="input hl-file" required /></label>
        <button type="submit" class="btn btn--primary btn--sm">Add Photo</button>
      </form>
      <div class="manage-images">${(block.photos || []).map((p) => `
        <div class="manage-card" style="display:inline-block;width:120px;margin:0.5rem 0.5rem 0 0">
          <img class="manage-card__img" src="${p.src}" alt="" />
          <div class="manage-card__body">
            <button class="btn btn--danger btn--sm" data-del-hp="${p.id}" data-hl="${block.id}">Del</button>
          </div>
        </div>`).join('')}</div>
    </div>`).join('');

  el.querySelectorAll('.hl-upload-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData();
      fd.append('section', 'highlights');
      fd.append('highlightId', form.dataset.hlId);
      fd.append('caption', form.querySelector('.hl-caption').value);
      fd.append('image', form.querySelector('.hl-file').files[0]);
      try {
        galleryData = (await uploadImage(fd)).gallery;
        renderHighlightsAdmin();
        showToast('Highlight photo added');
      } catch (err) { showToast(err.message, true); }
    });
  });

  el.querySelectorAll('[data-del-hp]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        galleryData = await api(`/images?section=highlights&highlightId=${btn.dataset.hl}&imageId=${btn.dataset.delHp}`, { method: 'DELETE' });
        renderHighlightsAdmin();
        showToast('Deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });

  el.querySelectorAll('[data-del-hl]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete chapter?')) return;
      galleryData.yearHighlights = galleryData.yearHighlights.filter((b) => b.id !== btn.dataset.delHl);
      galleryData = await api('/gallery/section/yearHighlights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: galleryData.yearHighlights }),
      });
      renderHighlightsAdmin();
      showToast('Chapter deleted');
    });
  });
}

document.getElementById('highlight-add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!galleryData.yearHighlights) galleryData.yearHighlights = [];
  galleryData.yearHighlights.unshift({
    id: uid('yh'),
    year: +document.getElementById('hl-year').value,
    label: document.getElementById('hl-label').value,
    photos: [],
  });
  galleryData = await api('/gallery/section/yearHighlights', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: galleryData.yearHighlights }),
  });
  document.getElementById('highlight-add-form').reset();
  renderHighlightsAdmin();
  showToast('Chapter added');
});

/* ── Quotes ── */
function renderQuotesList() {
  const el = document.getElementById('quotes-list');
  el.innerHTML = (galleryData.quotes || []).map((q, i) => `
    <div class="admin-item">
      <div class="admin-item__body"><p class="admin-item__title">"${q.text}"</p><p class="admin-item__meta">${q.date || ''}</p></div>
      <button class="btn btn--danger btn--sm" data-del-q="${i}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-q]').forEach((btn) => {
    btn.addEventListener('click', () => { galleryData.quotes.splice(+btn.dataset.delQ, 1); renderQuotesList(); });
  });
}

document.getElementById('quote-add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!galleryData.quotes) galleryData.quotes = [];
  galleryData.quotes.push({ id: uid('q'), text: document.getElementById('quote-text').value, date: document.getElementById('quote-date').value });
  document.getElementById('quote-add-form').reset();
  renderQuotesList();
});

document.getElementById('quotes-save').addEventListener('click', async () => {
  galleryData = await api('/gallery/section/quotes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: galleryData.quotes }) });
  showToast('Quotes saved');
});

/* ── Places ── */
function renderPlacesList() {
  const el = document.getElementById('places-list');
  el.innerHTML = (galleryData.places || []).map((p, i) => `
    <div class="admin-item">
      <div class="admin-item__body"><p class="admin-item__title">${p.name}</p><p class="admin-item__meta">${p.location} — ${p.description}</p></div>
      <button class="btn btn--danger btn--sm" data-del-p="${i}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-p]').forEach((btn) => {
    btn.addEventListener('click', () => { galleryData.places.splice(+btn.dataset.delP, 1); renderPlacesList(); });
  });
}

document.getElementById('place-add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!galleryData.places) galleryData.places = [];
  galleryData.places.push({
    id: uid('p'),
    name: document.getElementById('place-name').value,
    location: document.getElementById('place-location').value,
    description: document.getElementById('place-desc').value,
  });
  document.getElementById('place-add-form').reset();
  renderPlacesList();
});

document.getElementById('places-save').addEventListener('click', async () => {
  galleryData = await api('/gallery/section/places', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: galleryData.places }) });
  showToast('Places saved');
});

/* ── Letter ── */
document.getElementById('letter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData = await api('/gallery/meta', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loveLetter: { title: document.getElementById('letter-title').value, content: document.getElementById('letter-content').value } }),
  });
  showToast('Letter saved');
});

/* ── Song ── */
document.getElementById('song-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData = await api('/gallery/meta', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ourSong: { title: document.getElementById('song-title').value, artist: document.getElementById('song-artist').value, url: document.getElementById('song-url').value } }),
  });
  showToast('Song saved');
});

/* ── Messages ── */
function renderMessagesList() {
  const el = document.getElementById('messages-list');
  el.innerHTML = (galleryData.anniversaryMessages || []).map((m, i) => `
    <div class="admin-item">
      <div class="admin-item__body"><p class="admin-item__title">${m.title}</p><p class="admin-item__meta">${m.date}</p></div>
      <button class="btn btn--danger btn--sm" data-del-m="${i}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-m]').forEach((btn) => {
    btn.addEventListener('click', () => { galleryData.anniversaryMessages.splice(+btn.dataset.delM, 1); renderMessagesList(); });
  });
}

document.getElementById('message-add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!galleryData.anniversaryMessages) galleryData.anniversaryMessages = [];
  galleryData.anniversaryMessages.unshift({
    id: uid('am'),
    year: 0,
    title: document.getElementById('msg-title').value,
    date: document.getElementById('msg-date').value,
    message: document.getElementById('msg-text').value,
  });
  document.getElementById('message-add-form').reset();
  renderMessagesList();
});

document.getElementById('messages-save').addEventListener('click', async () => {
  galleryData = await api('/gallery/section/anniversaryMessages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: galleryData.anniversaryMessages }) });
  showToast('Messages saved');
});

/* ── Videos ── */
function renderVideosList() {
  const el = document.getElementById('videos-list');
  el.innerHTML = (galleryData.videos || []).map((v, i) => `
    <div class="admin-item">
      <div class="admin-item__body"><p class="admin-item__title">${v.title}</p><p class="admin-item__meta">${v.url}</p></div>
      <button class="btn btn--danger btn--sm" data-del-v="${i}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-v]').forEach((btn) => {
    btn.addEventListener('click', () => { galleryData.videos.splice(+btn.dataset.delV, 1); renderVideosList(); });
  });
}

document.getElementById('video-add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!galleryData.videos) galleryData.videos = [];
  galleryData.videos.push({
    id: uid('v'),
    title: document.getElementById('video-title').value,
    url: document.getElementById('video-url').value,
    caption: document.getElementById('video-caption').value,
  });
  document.getElementById('video-add-form').reset();
  renderVideosList();
});

document.getElementById('videos-save').addEventListener('click', async () => {
  galleryData = await api('/gallery/section/videos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: galleryData.videos }) });
  showToast('Videos saved');
});

/* ── Password ── */
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData = await api('/gallery/meta', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sitePassword: document.getElementById('site-password').value }),
  });
  showToast('Password saved');
});

/* ── Gallery (months) ── */
function renderGalleryAdmin() {
  const monthSelect = document.getElementById('upload-month');
  monthSelect.innerHTML = '<option value="">Select month...</option>';
  (galleryData.months || []).forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.label;
    monthSelect.appendChild(opt);
  });

  const container = document.getElementById('manage-list');
  container.innerHTML = '';
  (galleryData.months || []).forEach((month) => {
    const section = document.createElement('div');
    section.className = 'manage-month';
    section.innerHTML = `<div class="manage-month__header"><h3 class="manage-month__title">${month.label} (${month.images.length})</h3><button class="btn btn--danger btn--sm" data-del-month="${month.id}">Delete Month</button></div>`;
    const grid = document.createElement('div');
    grid.className = 'manage-images';
    month.images.forEach((img) => {
      const card = document.createElement('div');
      card.className = 'manage-card';
      card.innerHTML = `<img class="manage-card__img" src="${img.src}" alt="" /><div class="manage-card__body"><button class="btn btn--danger btn--sm" data-del-img="${img.id}" data-month="${month.id}">Delete</button></div>`;
      grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  });

  container.querySelectorAll('[data-del-month]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete month?')) return;
      galleryData = await api(`/months/${btn.dataset.delMonth}`, { method: 'DELETE' });
      renderGalleryAdmin();
      showToast('Month deleted');
    });
  });

  container.querySelectorAll('[data-del-img]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete photo?')) return;
      galleryData = await api(`/images/${btn.dataset.delImg}?monthId=${btn.dataset.month}`, { method: 'DELETE' });
      renderGalleryAdmin();
      showToast('Photo deleted');
    });
  });
}

document.getElementById('add-month-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData = await api('/months', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: document.getElementById('month-id').value, label: document.getElementById('month-label').value }),
  });
  document.getElementById('add-month-form').reset();
  renderGalleryAdmin();
  showToast('Month added');
});

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('upload-file').files[0];
  if (!file) { showToast('Select a photo', true); return; }
  const fd = new FormData();
  fd.append('image', file);
  fd.append('monthId', document.getElementById('upload-month').value);
  fd.append('caption', document.getElementById('upload-caption').value);
  fd.append('date', document.getElementById('upload-date').value || new Date().toISOString().split('T')[0]);
  try {
    galleryData = (await api('/images', { method: 'POST', body: fd })).gallery;
    document.getElementById('upload-form').reset();
    renderGalleryAdmin();
    showToast('Photo uploaded');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '/admin.html';
});

initTabs();
loadGallery();
