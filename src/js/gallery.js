import { loadGallery } from './gallery-api.js';

const SITE_AUTH_KEY = 'gallery-site-auth';

function assetUrl(src) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.startsWith('/') ? src.slice(1) : src;
  return `${import.meta.env.BASE_URL}${path}`;
}

let galleryData = null;
let allImages = [];
let currentLightboxIndex = 0;
let slideshowTimer = null;
let slideshowIndex = 0;

const SECTIONS = [
  { id: 'section-featured', label: 'Featured' },
  { id: 'section-timeline', label: 'Our Story' },
  { id: 'section-then-now', label: 'Then & Now' },
  { id: 'section-wedding', label: 'Wedding' },
  { id: 'section-highlights', label: 'Highlights' },
  { id: 'section-quotes', label: 'Quotes' },
  { id: 'section-places', label: 'Places' },
  { id: 'section-letter', label: 'Letter' },
  { id: 'section-song', label: 'Our Song' },
  { id: 'section-messages', label: 'Messages' },
  { id: 'section-videos', label: 'Videos' },
  { id: 'section-gallery', label: 'Gallery' },
];

async function init() {
  try {
    galleryData = await loadGallery();
  } catch {
    galleryData = { title: 'Our Love Story', months: [] };
  }

  if (galleryData.sitePassword && sessionStorage.getItem(SITE_AUTH_KEY) !== galleryData.sitePassword) {
    showSiteLock();
    return;
  }

  renderAll();
}

function showSiteLock() {
  const lock = document.getElementById('site-lock');
  lock.hidden = false;
  document.getElementById('main-page').style.display = 'none';

  document.getElementById('site-lock-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pw = document.getElementById('site-lock-password').value;
    if (pw === galleryData.sitePassword) {
      sessionStorage.setItem(SITE_AUTH_KEY, pw);
      lock.hidden = true;
      document.getElementById('main-page').style.display = '';
      renderAll();
    } else {
      const err = document.getElementById('site-lock-error');
      err.textContent = 'Incorrect password';
      err.hidden = false;
    }
  });
}

function renderAll() {
  renderMeta();
  renderSectionNav();
  renderFeatured();
  renderTimeline();
  renderThenNow();
  renderWedding();
  renderHighlights();
  renderQuotes();
  renderPlaces();
  renderLetter();
  renderSong();
  renderMessages();
  renderVideos();
  renderMonthNav();
  renderGallery();
  buildLightboxList();
  setupLightbox();
  setupSlideshow();
}

function renderMeta() {
  document.getElementById('site-title').textContent = galleryData.title || 'Our Love Story';
  document.getElementById('site-subtitle').textContent = galleryData.subtitle || '';
  document.title = galleryData.title || 'Our Love Story';

  const wedding = galleryData.weddingDate ? new Date(galleryData.weddingDate + 'T00:00:00') : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const counter = document.getElementById('days-counter');
  const countdown = document.getElementById('wedding-countdown');

  if (galleryData.togetherSince) {
    const together = new Date(galleryData.togetherSince + 'T00:00:00');
    const days = Math.floor((now - together) / 86400000);
    if (days >= 0) counter.textContent = `${days.toLocaleString()} days together`;
  }

  if (wedding) {
    const daysUntil = Math.ceil((wedding - now) / 86400000);
    if (daysUntil > 0) {
      countdown.textContent = `${daysUntil} day${daysUntil === 1 ? '' : 's'} until we say I do ♡`;
      document.getElementById('hero-eyebrow').textContent = 'Counting Down to Forever';
    } else if (daysUntil === 0) {
      countdown.textContent = 'Today is our wedding day! ♡';
    } else {
      const married = Math.abs(daysUntil);
      countdown.textContent = `Married ${married} day${married === 1 ? '' : 's'} — and counting`;
      document.getElementById('hero-eyebrow').textContent = 'Our Forever Begins';
    }
  }
}

function renderSectionNav() {
  const nav = document.getElementById('section-nav');
  nav.innerHTML = '';
  SECTIONS.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = `section-nav__btn${i === 0 ? ' section-nav__btn--active' : ''}`;
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(btn);
  });
}

function renderFeatured() {
  const el = document.getElementById('featured-content');
  const fp = galleryData.featuredPhoto;
  if (!fp?.src) {
    document.getElementById('section-featured').hidden = true;
    return;
  }

  const locked = fp.comingSoon !== false;
  const lockLabel = fp.comingSoonLabel || 'Coming Soon';

  el.innerHTML = `
    <div class="featured${locked ? ' featured--locked' : ''}" data-image-id="featured">
      <img class="featured__img" src="${esc(assetUrl(fp.src))}" alt="${esc(fp.caption)}" loading="eager" />
      ${locked ? `
        <div class="featured__lock">
          <div class="featured__lock-inner">
            <svg class="featured__lock-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1.2" fill="currentColor"/>
            </svg>
            <p class="featured__lock-label">${esc(lockLabel)}</p>
            <p class="featured__lock-hint">Our wedding photos await</p>
          </div>
        </div>` : ''}
      ${fp.caption && !locked ? `<p class="featured__caption">${esc(fp.caption)}</p>` : ''}
    </div>`;

  if (!locked) {
    el.querySelector('.featured').addEventListener('click', () => openLightboxBySrc(fp.src, fp.caption));
  }
}

function renderTimeline() {
  const el = document.getElementById('timeline-content');
  const items = galleryData.timeline || [];
  if (!items.length) {
    document.getElementById('section-timeline').hidden = true;
    return;
  }
  el.innerHTML = items.map((item) => `
    <div class="timeline__item${item.upcoming ? ' timeline__item--upcoming' : ''}">
      <p class="timeline__date">${formatDate(item.date)}</p>
      <h3 class="timeline__title">${esc(item.title)}</h3>
      <p class="timeline__desc">${esc(item.description)}</p>
      ${item.upcoming ? '<span class="timeline__badge">Coming Soon</span>' : ''}
      ${item.image ? `<img class="timeline__img" src="${esc(assetUrl(item.image))}" alt="${esc(item.title)}" data-src="${esc(item.image)}" data-caption="${esc(item.title)}" />` : ''}
    </div>`).join('');

  el.querySelectorAll('.timeline__img').forEach((img) => {
    img.addEventListener('click', () => openLightboxBySrc(img.dataset.src, img.dataset.caption));
  });
}

function renderThenNow() {
  const el = document.getElementById('then-now-content');
  const tn = galleryData.thenAndNow;
  if (!tn?.then?.src && !tn?.now?.src) {
    document.getElementById('section-then-now').hidden = true;
    return;
  }
  el.innerHTML = ['then', 'now'].map((key) => {
    const side = tn[key];
    if (!side?.src) return '';
    return `
      <article class="then-now__card">
        <p class="then-now__label">${key === 'then' ? 'Then' : 'Now'}</p>
        <div class="then-now__img-wrap">
          <img class="then-now__img" src="${esc(assetUrl(side.src))}" alt="${esc(side.caption)}" />
        </div>
        ${side.caption ? `<p class="then-now__caption">${esc(side.caption)}</p>` : ''}
      </article>`;
  }).join('');

  el.querySelectorAll('.then-now__card').forEach((card, i) => {
    const key = i === 0 ? 'then' : 'now';
    card.addEventListener('click', () => openLightboxBySrc(tn[key].src, tn[key].caption));
  });
}

function renderWedding() {
  const header = document.getElementById('wedding-header');
  const el = document.getElementById('wedding-content');
  const wd = galleryData.weddingDay;
  if (!wd) {
    document.getElementById('section-wedding').hidden = true;
    return;
  }

  header.innerHTML = `
    <p class="section__eyebrow">The Big Day</p>
    <h2 class="section__title">${esc(wd.title || 'Our Wedding Day')}</h2>
    ${wd.subtitle ? `<p class="section__eyebrow" style="margin-top:0.5rem;font-style:italic;text-transform:none;letter-spacing:0.05em;font-size:0.9rem;">${esc(wd.subtitle)}</p>` : ''}`;

  const images = wd.images || [];
  if (!images.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state__icon">♡</div><p>Photos from our wedding day will appear here.</p></div>';
    return;
  }
  el.innerHTML = '';
  images.forEach((img) => el.appendChild(createPhotoCard(img)));
}

function renderHighlights() {
  const el = document.getElementById('highlights-content');
  const blocks = galleryData.yearHighlights || [];
  if (!blocks.length) {
    document.getElementById('section-highlights').hidden = true;
    return;
  }
  el.innerHTML = blocks.map((block) => `
    <div class="highlight-block">
      <h3 class="highlight-block__title">${esc(block.label)}</h3>
      <div class="photo-grid">${(block.photos || []).map((p) => `
        <article class="photo-card" data-id="${esc(p.id)}">
          <div class="photo-card__img-wrap"><img class="photo-card__img" src="${esc(assetUrl(p.src))}" alt="${esc(p.caption)}" loading="lazy" data-src="${esc(p.src)}" /></div>
          ${p.caption ? `<div class="photo-card__info"><p class="photo-card__caption">${esc(p.caption)}</p></div>` : ''}
        </article>`).join('')}</div>
    </div>`).join('');

  el.querySelectorAll('.photo-card').forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      openLightboxBySrc(card.querySelector('img')?.dataset.src || img.src, card.querySelector('.photo-card__caption')?.textContent || '');
    });
  });
}

function renderQuotes() {
  const el = document.getElementById('quotes-content');
  const quotes = galleryData.quotes || [];
  if (!quotes.length) {
    document.getElementById('section-quotes').hidden = true;
    return;
  }
  el.innerHTML = quotes.map((q) => `
    <blockquote class="quote-card">
      <p class="quote-card__text">${esc(q.text)}</p>
      ${q.date ? `<p class="quote-card__date">${formatDate(q.date)}</p>` : ''}
    </blockquote>`).join('');
}

function renderPlaces() {
  const el = document.getElementById('places-content');
  const places = galleryData.places || [];
  if (!places.length) {
    document.getElementById('section-places').hidden = true;
    return;
  }
  el.innerHTML = places.map((p) => `
    <article class="place-card">
      <span class="place-card__pin">📍</span>
      <div>
        <h3 class="place-card__name">${esc(p.name)}</h3>
        ${p.location ? `<p class="place-card__location">${esc(p.location)}</p>` : ''}
        ${p.description ? `<p class="place-card__desc">${esc(p.description)}</p>` : ''}
      </div>
    </article>`).join('');
}

function renderLetter() {
  const el = document.getElementById('letter-content');
  const letter = galleryData.loveLetter;
  if (!letter?.content) {
    document.getElementById('section-letter').hidden = true;
    return;
  }
  el.innerHTML = `
    ${letter.title ? `<h2 class="love-letter__title">${esc(letter.title)}</h2>` : ''}
    <p class="love-letter__content">${esc(letter.content)}</p>`;
}

function renderSong() {
  const el = document.getElementById('song-content');
  const song = galleryData.ourSong;
  if (!song?.title) {
    document.getElementById('section-song').hidden = true;
    return;
  }
  el.innerHTML = `
    <div class="song-block">
      <p class="song-block__label">Our Song</p>
      <h2 class="song-block__title">${esc(song.title)}</h2>
      ${song.artist ? `<p class="song-block__artist">${esc(song.artist)}</p>` : ''}
      ${song.url ? `<a class="song-block__link" href="${esc(song.url)}" target="_blank" rel="noopener">Listen on Spotify</a>` : ''}
    </div>`;
}

function renderMessages() {
  const el = document.getElementById('messages-content');
  const msgs = galleryData.anniversaryMessages || [];
  if (!msgs.length) {
    document.getElementById('section-messages').hidden = true;
    return;
  }
  el.innerHTML = msgs.map((m) => `
    <article class="message-card">
      <h3 class="message-card__title">${esc(m.title)}</h3>
      ${m.date ? `<p class="message-card__date">${formatDate(m.date)}</p>` : ''}
      <p class="message-card__text">${esc(m.message)}</p>
    </article>`).join('');
}

function renderVideos() {
  const el = document.getElementById('videos-content');
  const videos = galleryData.videos || [];
  if (!videos.length) {
    document.getElementById('section-videos').hidden = true;
    return;
  }
  el.innerHTML = videos.map((v) => `
    <article class="video-card">
      <iframe class="video-card__embed" src="${esc(v.url)}" title="${esc(v.title)}" allowfullscreen loading="lazy"></iframe>
      <div class="video-card__info">
        <h3 class="video-card__title">${esc(v.title)}</h3>
        ${v.caption ? `<p class="video-card__caption">${esc(v.caption)}</p>` : ''}
      </div>
    </article>`).join('');
}

function renderMonthNav() {
  const nav = document.getElementById('month-nav');
  nav.innerHTML = '';
  (galleryData.months || []).forEach((month, i) => {
    const btn = document.createElement('button');
    btn.className = `month-nav__btn${i === 0 ? ' month-nav__btn--active' : ''}`;
    btn.textContent = month.label;
    btn.addEventListener('click', () => {
      document.getElementById(`month-${month.id}`)?.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(btn);
  });
}

function renderGallery() {
  const container = document.getElementById('gallery');
  container.innerHTML = '';
  const months = galleryData.months || [];

  if (!months.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">♡</div><p>No photos yet — our story is just beginning.</p></div>';
    return;
  }

  months.forEach((month) => {
    const section = document.createElement('section');
    section.className = 'month-section';
    section.id = `month-${month.id}`;
    const count = month.images.length;
    section.innerHTML = `
      <div class="month-section__header">
        <h3 class="month-section__label">${esc(month.label)}</h3>
        <p class="month-section__count">${count} photo${count === 1 ? '' : 's'}</p>
      </div>
      <div class="month-section__grid"></div>`;
    const grid = section.querySelector('.month-section__grid');
    if (!count) {
      grid.innerHTML = '<p class="empty-state" style="grid-column:1/-1">No photos this month yet.</p>';
    } else {
      month.images.forEach((img) => grid.appendChild(createPhotoCard(img)));
    }
    container.appendChild(section);
  });
}

function createPhotoCard(img) {
  const card = document.createElement('article');
  card.className = 'photo-card';
  card.innerHTML = `
    <div class="photo-card__img-wrap">
      <img class="photo-card__img" src="${esc(assetUrl(img.src))}" alt="${esc(img.caption || 'Photo')}" loading="lazy" data-src="${esc(img.src)}" />
    </div>
    <div class="photo-card__info">
      ${img.caption ? `<p class="photo-card__caption">${esc(img.caption)}</p>` : ''}
      ${img.date ? `<p class="photo-card__date">${formatDate(img.date)}</p>` : ''}
    </div>`;
  card.addEventListener('click', () => openLightbox(img.id));
  return card;
}

function buildLightboxList() {
  allImages = [];
  const add = (img, caption) => {
    if (img?.src) {
      allImages.push({
        id: img.id || img.src,
        rawSrc: img.src,
        src: assetUrl(img.src),
        caption: caption || img.caption || '',
      });
    }
  };

  if (galleryData.featuredPhoto?.src && galleryData.featuredPhoto.comingSoon === false) {
    add(galleryData.featuredPhoto);
  }
  (galleryData.weddingDay?.images || []).forEach((i) => add(i));
  (galleryData.yearHighlights || []).forEach((b) => (b.photos || []).forEach((p) => add(p)));
  (galleryData.months || []).forEach((m) => m.images.forEach((i) => add(i)));
  if (galleryData.thenAndNow?.then?.src) add({ ...galleryData.thenAndNow.then, id: 'then' });
  if (galleryData.thenAndNow?.now?.src) add({ ...galleryData.thenAndNow.now, id: 'now' });
}

function openLightbox(imageId) {
  currentLightboxIndex = allImages.findIndex((i) => i.id === imageId);
  if (currentLightboxIndex === -1) return;
  showLightboxImage();
  document.getElementById('lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}

function openLightboxBySrc(src, caption) {
  currentLightboxIndex = allImages.findIndex((i) => i.rawSrc === src || i.src === src);
  if (currentLightboxIndex === -1) {
    allImages.push({ id: src, rawSrc: src, src: assetUrl(src), caption: caption || '' });
    currentLightboxIndex = allImages.length - 1;
  }
  showLightboxImage();
  document.getElementById('lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}

function showLightboxImage() {
  const img = allImages[currentLightboxIndex];
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-img').alt = img.caption || '';
  document.getElementById('lightbox-caption').textContent = img.caption || '';
}

function closeLightbox() {
  document.getElementById('lightbox').hidden = true;
  document.body.style.overflow = '';
}

function setupLightbox() {
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => {
    currentLightboxIndex = (currentLightboxIndex - 1 + allImages.length) % allImages.length;
    showLightboxImage();
  });
  document.getElementById('lightbox-next').addEventListener('click', () => {
    currentLightboxIndex = (currentLightboxIndex + 1) % allImages.length;
    showLightboxImage();
  });
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightbox-prev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightbox-next').click();
  });
}

function setupSlideshow() {
  document.getElementById('slideshow-btn').addEventListener('click', startSlideshow);
  document.getElementById('slideshow-close').addEventListener('click', stopSlideshow);
}

function startSlideshow() {
  if (!allImages.length) buildLightboxList();
  if (!allImages.length) return;
  slideshowIndex = 0;
  document.getElementById('slideshow').hidden = false;
  document.body.style.overflow = 'hidden';
  showSlide();
  slideshowTimer = setInterval(() => {
    slideshowIndex = (slideshowIndex + 1) % allImages.length;
    showSlide();
  }, 4000);
}

function showSlide() {
  const img = allImages[slideshowIndex];
  document.getElementById('slideshow-img').src = img.src;
  document.getElementById('slideshow-caption').textContent = img.caption || '';
  document.getElementById('slideshow-progress').style.width = `${((slideshowIndex + 1) / allImages.length) * 100}%`;
}

function stopSlideshow() {
  clearInterval(slideshowTimer);
  document.getElementById('slideshow').hidden = true;
  document.body.style.overflow = '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

init();
