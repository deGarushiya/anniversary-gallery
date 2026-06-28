import {
  isFirebaseConfigured,
  watchAuth,
  firebaseSignOut,
} from './firebase-app.js';
import {
  loadGallery,
  saveGallery,
  uploadImage,
  deleteImage,
  deleteMonth,
  addMonth,
  uid,
  usesFirebase,
} from './gallery-api.js';

const SESSION_KEY = 'gallery-admin-auth';
const toast = document.getElementById('toast');
let galleryData = null;

function showToast(msg, err = false) {
  toast.textContent = msg;
  toast.className = err ? 'toast toast--error' : 'toast';
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 3000);
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

async function loadGalleryData() {
  try {
    galleryData = await loadGallery();
    if (!usesFirebase()) {
      try {
        const r = await fetch('/api/gallery');
        if (!r.ok) throw new Error();
      } catch {
        showToast('Local mode — run npm run dev for file-based saves', true);
      }
    }
  } catch (err) {
    showToast(err.message || 'Failed to load', true);
    galleryData = { months: [] };
  }
  populateAll();
}

function populateAll() {
  document.getElementById('setting-title').value = galleryData.title || '';
  document.getElementById('setting-subtitle').value = galleryData.subtitle || '';
  document.getElementById('setting-wedding').value = galleryData.weddingDate || '';
  document.getElementById('setting-together').value = galleryData.togetherSince || '';
  document.getElementById('featured-caption').value = galleryData.featuredPhoto?.caption || '';
  document.getElementById('featured-coming-soon').checked = galleryData.featuredPhoto?.comingSoon !== false;
  document.getElementById('featured-lock-label').value = galleryData.featuredPhoto?.comingSoonLabel || 'Coming Soon';
  document.getElementById('featured-preview').innerHTML = galleryData.featuredPhoto?.src
    ? `<img src="${galleryData.featuredPhoto.src}" alt="" />` : '';
  document.getElementById('then-caption').value = galleryData.thenAndNow?.then?.caption || '';
  document.getElementById('now-caption').value = galleryData.thenAndNow?.now?.caption || '';
  document.getElementById('then-preview').innerHTML = galleryData.thenAndNow?.then?.src
    ? `<img src="${galleryData.thenAndNow.then.src}" alt="" />` : '';
  document.getElementById('now-preview').innerHTML = galleryData.thenAndNow?.now?.src
    ? `<img src="${galleryData.thenAndNow.now.src}" alt="" />` : '';
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

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    galleryData.title = document.getElementById('setting-title').value;
    galleryData.subtitle = document.getElementById('setting-subtitle').value;
    galleryData.weddingDate = document.getElementById('setting-wedding').value;
    galleryData.togetherSince = document.getElementById('setting-together').value;
    galleryData = await saveGallery(galleryData);
    showToast('Settings saved');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('featured-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('featured-file').files[0];
  try {
    galleryData.featuredPhoto = {
      ...galleryData.featuredPhoto,
      caption: document.getElementById('featured-caption').value,
      comingSoon: document.getElementById('featured-coming-soon').checked,
      comingSoonLabel: document.getElementById('featured-lock-label').value || 'Coming Soon',
    };
    if (file) {
      galleryData = await uploadImage(galleryData, { section: 'featured', file, caption: galleryData.featuredPhoto.caption });
    } else {
      if (!galleryData.featuredPhoto?.src) { showToast('Select an image', true); return; }
      galleryData = await saveGallery(galleryData);
    }
    populateAll();
    showToast('Featured photo saved');
  } catch (err) { showToast(err.message, true); }
});

function renderTimelineList() {
  const el = document.getElementById('timeline-list');
  el.innerHTML = (galleryData.timeline || []).map((item, i) => `
    <div class="admin-item">
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
    galleryData = await saveGallery(galleryData);
    showToast('Timeline saved');
  } catch (err) { showToast(err.message, true); }
});

async function saveThenNow(side) {
  const file = document.getElementById(`${side}-file`).files[0];
  const caption = document.getElementById(`${side}-caption`).value;
  if (file) {
    galleryData = await uploadImage(galleryData, { section: side, file, caption });
  } else {
    if (!galleryData.thenAndNow) galleryData.thenAndNow = {};
    galleryData.thenAndNow[side] = { ...galleryData.thenAndNow[side], caption };
    galleryData = await saveGallery(galleryData);
  }
  populateAll();
  showToast(`${side === 'then' ? 'Then' : 'Now'} saved`);
}

document.getElementById('then-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await saveThenNow('then'); } catch (err) { showToast(err.message, true); }
});

document.getElementById('now-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await saveThenNow('now'); } catch (err) { showToast(err.message, true); }
});

document.getElementById('wedding-meta-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    galleryData.weddingDay = {
      ...galleryData.weddingDay,
      title: document.getElementById('wedding-title').value,
      subtitle: document.getElementById('wedding-subtitle').value,
    };
    galleryData = await saveGallery(galleryData);
    showToast('Wedding section saved');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('wedding-upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('wedding-file').files[0];
  if (!file) { showToast('Select a photo', true); return; }
  try {
    galleryData = await uploadImage(galleryData, {
      section: 'wedding',
      file,
      caption: document.getElementById('wedding-caption').value,
      date: document.getElementById('wedding-date').value,
    });
    document.getElementById('wedding-upload-form').reset();
    renderWeddingList();
    showToast('Wedding photo uploaded');
  } catch (err) { showToast(err.message, true); }
});

function renderWeddingList() {
  const el = document.getElementById('wedding-list');
  el.innerHTML = (galleryData.weddingDay?.images || []).map((img) => `
    <div class="admin-item">
      <img src="${img.src}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
      <div class="admin-item__body"><p class="admin-item__title">${img.caption || 'No caption'}</p></div>
      <button class="btn btn--danger btn--sm" data-del-wd="${img.id}">Delete</button>
    </div>`).join('');
  el.querySelectorAll('[data-del-wd]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete?')) return;
      try {
        galleryData = await deleteImage(galleryData, { section: 'wedding', imageId: btn.dataset.delWd });
        renderWeddingList();
        showToast('Deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });
}

function renderHighlightsAdmin() {
  const el = document.getElementById('highlights-admin');
  el.innerHTML = (galleryData.yearHighlights || []).map((block) => `
    <div class="highlight-admin-block">
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
      try {
        galleryData = await uploadImage(galleryData, {
          section: 'highlights',
          highlightId: form.dataset.hlId,
          file: form.querySelector('.hl-file').files[0],
          caption: form.querySelector('.hl-caption').value,
        });
        renderHighlightsAdmin();
        showToast('Highlight photo added');
      } catch (err) { showToast(err.message, true); }
    });
  });

  el.querySelectorAll('[data-del-hp]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        galleryData = await deleteImage(galleryData, {
          section: 'highlights',
          highlightId: btn.dataset.hl,
          imageId: btn.dataset.delHp,
        });
        renderHighlightsAdmin();
        showToast('Deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });

  el.querySelectorAll('[data-del-hl]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete chapter?')) return;
      galleryData.yearHighlights = galleryData.yearHighlights.filter((b) => b.id !== btn.dataset.delHl);
      try {
        galleryData = await saveGallery(galleryData);
        renderHighlightsAdmin();
        showToast('Chapter deleted');
      } catch (err) { showToast(err.message, true); }
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
  try {
    galleryData = await saveGallery(galleryData);
    document.getElementById('highlight-add-form').reset();
    renderHighlightsAdmin();
    showToast('Chapter added');
  } catch (err) { showToast(err.message, true); }
});

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
  try { galleryData = await saveGallery(galleryData); showToast('Quotes saved'); }
  catch (err) { showToast(err.message, true); }
});

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
  try { galleryData = await saveGallery(galleryData); showToast('Places saved'); }
  catch (err) { showToast(err.message, true); }
});

document.getElementById('letter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData.loveLetter = { title: document.getElementById('letter-title').value, content: document.getElementById('letter-content').value };
  try { galleryData = await saveGallery(galleryData); showToast('Letter saved'); }
  catch (err) { showToast(err.message, true); }
});

document.getElementById('song-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData.ourSong = {
    title: document.getElementById('song-title').value,
    artist: document.getElementById('song-artist').value,
    url: document.getElementById('song-url').value,
  };
  try { galleryData = await saveGallery(galleryData); showToast('Song saved'); }
  catch (err) { showToast(err.message, true); }
});

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
    id: uid('am'), year: 0,
    title: document.getElementById('msg-title').value,
    date: document.getElementById('msg-date').value,
    message: document.getElementById('msg-text').value,
  });
  document.getElementById('message-add-form').reset();
  renderMessagesList();
});

document.getElementById('messages-save').addEventListener('click', async () => {
  try { galleryData = await saveGallery(galleryData); showToast('Messages saved'); }
  catch (err) { showToast(err.message, true); }
});

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
  try { galleryData = await saveGallery(galleryData); showToast('Videos saved'); }
  catch (err) { showToast(err.message, true); }
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  galleryData.sitePassword = document.getElementById('site-password').value;
  try { galleryData = await saveGallery(galleryData); showToast('Password saved'); }
  catch (err) { showToast(err.message, true); }
});

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
      try {
        galleryData = await deleteMonth(galleryData, btn.dataset.delMonth);
        renderGalleryAdmin();
        showToast('Month deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });

  container.querySelectorAll('[data-del-img]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete photo?')) return;
      try {
        galleryData = await deleteImage(galleryData, {
          section: 'months',
          monthId: btn.dataset.month,
          imageId: btn.dataset.delImg,
        });
        renderGalleryAdmin();
        showToast('Photo deleted');
      } catch (err) { showToast(err.message, true); }
    });
  });
}

document.getElementById('add-month-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    galleryData = await addMonth(galleryData, {
      id: document.getElementById('month-id').value,
      label: document.getElementById('month-label').value,
    });
    document.getElementById('add-month-form').reset();
    renderGalleryAdmin();
    showToast('Month added');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('upload-file').files[0];
  if (!file) { showToast('Select a photo', true); return; }
  try {
    galleryData = await uploadImage(galleryData, {
      section: 'months',
      monthId: document.getElementById('upload-month').value,
      file,
      caption: document.getElementById('upload-caption').value,
      date: document.getElementById('upload-date').value || new Date().toISOString().split('T')[0],
    });
    document.getElementById('upload-form').reset();
    renderGalleryAdmin();
    showToast('Photo uploaded');
  } catch (err) { showToast(err.message, true); }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  if (isFirebaseConfigured()) await firebaseSignOut();
  else sessionStorage.removeItem(SESSION_KEY);
  window.location.href = `${import.meta.env.BASE_URL}admin.html`;
});

function startApp() {
  initTabs();
  loadGalleryData();
}

if (isFirebaseConfigured()) {
  watchAuth((user) => {
    if (!user) window.location.replace(`${import.meta.env.BASE_URL}admin.html`);
    else startApp();
  });
} else {
  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    window.location.replace(`${import.meta.env.BASE_URL}admin.html`);
  }
  startApp();
}
