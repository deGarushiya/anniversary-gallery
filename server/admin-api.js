import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'public', 'data', 'gallery.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function readGallery() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeGallery(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function imagePath(section, folderId, filename) {
  if (section === 'months') return `/images/months/${folderId}/${filename}`;
  return `/images/${section}/${filename}`;
}

function deleteFileIfLocal(src) {
  if (!src || src.startsWith('http')) return;
  const filePath = path.join(ROOT, 'public', src);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const section = req.body.section || 'misc';
    const folderId = req.body.folderId || '';
    const dir = section === 'months'
      ? path.join(IMAGES_DIR, 'months', folderId)
      : path.join(IMAGES_DIR, section);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    cb(/\.(jpe?g|png|gif|webp)$/i.test(file.originalname) ? null : new Error('Only image files allowed'));
  },
});

app.get('/api/gallery', (_req, res) => res.json(readGallery()));

app.put('/api/gallery/meta', (req, res) => {
  const gallery = readGallery();
  const fields = [
    'title', 'subtitle', 'weddingDate', 'togetherSince', 'sitePassword',
    'featuredPhoto', 'ourSong', 'loveLetter', 'thenAndNow', 'weddingDay',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) gallery[f] = req.body[f];
  });
  writeGallery(gallery);
  res.json(gallery);
});

app.put('/api/gallery/section/:name', (req, res) => {
  const allowed = ['timeline', 'quotes', 'places', 'yearHighlights', 'anniversaryMessages', 'videos'];
  const { name } = req.params;
  if (!allowed.includes(name)) return res.status(400).json({ error: 'Invalid section' });
  const gallery = readGallery();
  gallery[name] = req.body.items ?? req.body;
  writeGallery(gallery);
  res.json(gallery);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const { section, folderId, caption, date, target, highlightId } = req.body;
  if (!section) return res.status(400).json({ error: 'section is required' });

  const gallery = readGallery();
  const src = imagePath(section, folderId, req.file.filename);
  const image = { id: uid('img'), src, caption: caption || '', date: date || new Date().toISOString().split('T')[0] };

  if (section === 'months') {
    const month = gallery.months.find((m) => m.id === folderId);
    if (!month) return res.status(404).json({ error: 'Month not found' });
    month.images.unshift(image);
  } else if (section === 'wedding') {
    if (!gallery.weddingDay) gallery.weddingDay = { title: '', subtitle: '', images: [] };
    gallery.weddingDay.images.unshift(image);
  } else if (section === 'featured') {
    if (gallery.featuredPhoto?.src) deleteFileIfLocal(gallery.featuredPhoto.src);
    gallery.featuredPhoto = { src, caption: caption || '' };
  } else if (section === 'then' || section === 'now') {
    if (!gallery.thenAndNow) gallery.thenAndNow = {};
    if (gallery.thenAndNow[section]?.src) deleteFileIfLocal(gallery.thenAndNow[section].src);
    gallery.thenAndNow[section] = { src, caption: caption || '' };
  } else if (section === 'highlights') {
    const hl = gallery.yearHighlights.find((y) => y.id === highlightId);
    if (!hl) return res.status(404).json({ error: 'Highlight not found' });
    hl.photos.unshift({ id: image.id, src: image.src, caption: image.caption });
  } else if (section === 'timeline') {
    const item = gallery.timeline.find((t) => t.id === target);
    if (!item) return res.status(404).json({ error: 'Timeline item not found' });
    if (item.image) deleteFileIfLocal(item.image);
    item.image = src;
  } else {
    return res.status(400).json({ error: 'Unknown section' });
  }

  writeGallery(gallery);
  res.json({ gallery, image });
});

app.post('/api/months', (req, res) => {
  const { id, label } = req.body;
  if (!id || !label) return res.status(400).json({ error: 'id and label required' });
  const gallery = readGallery();
  if (gallery.months.some((m) => m.id === id)) return res.status(409).json({ error: 'Month exists' });
  gallery.months.unshift({ id, label, images: [] });
  fs.mkdirSync(path.join(IMAGES_DIR, 'months', id), { recursive: true });
  writeGallery(gallery);
  res.json(gallery);
});

app.delete('/api/months/:id', (req, res) => {
  const gallery = readGallery();
  const idx = gallery.months.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  gallery.months[idx].images.forEach((img) => deleteFileIfLocal(img.src));
  const dir = path.join(IMAGES_DIR, 'months', req.params.id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  gallery.months.splice(idx, 1);
  writeGallery(gallery);
  res.json(gallery);
});

app.delete('/api/images', (req, res) => {
  const { section, folderId, imageId, highlightId } = req.query;
  const gallery = readGallery();

  if (section === 'months') {
    const month = gallery.months.find((m) => m.id === folderId);
    if (!month) return res.status(404).json({ error: 'Not found' });
    const idx = month.images.findIndex((i) => i.id === imageId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    deleteFileIfLocal(month.images[idx].src);
    month.images.splice(idx, 1);
  } else if (section === 'wedding') {
    const idx = gallery.weddingDay.images.findIndex((i) => i.id === imageId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    deleteFileIfLocal(gallery.weddingDay.images[idx].src);
    gallery.weddingDay.images.splice(idx, 1);
  } else if (section === 'highlights') {
    const hl = gallery.yearHighlights.find((y) => y.id === highlightId);
    if (!hl) return res.status(404).json({ error: 'Not found' });
    const idx = hl.photos.findIndex((i) => i.id === imageId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    deleteFileIfLocal(hl.photos[idx].src);
    hl.photos.splice(idx, 1);
  } else {
    return res.status(400).json({ error: 'Invalid section' });
  }

  writeGallery(gallery);
  res.json(gallery);
});

app.post('/api/images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const { monthId, caption, date } = req.body;
  if (!monthId) return res.status(400).json({ error: 'monthId is required' });

  const gallery = readGallery();
  const month = gallery.months.find((m) => m.id === monthId);
  if (!month) return res.status(404).json({ error: 'Month not found' });

  const src = imagePath('months', monthId, req.file.filename);
  const image = {
    id: uid('img'),
    src,
    caption: caption || '',
    date: date || new Date().toISOString().split('T')[0],
  };
  month.images.unshift(image);
  writeGallery(gallery);
  res.json({ gallery, image });
});

app.delete('/api/images/:id', (req, res) => {
  req.query.section = 'months';
  req.query.folderId = req.query.monthId;
  req.query.imageId = req.params.id;
  const gallery = readGallery();
  const month = gallery.months.find((m) => m.id === req.query.monthId);
  if (!month) return res.status(404).json({ error: 'Not found' });
  const idx = month.images.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  deleteFileIfLocal(month.images[idx].src);
  month.images.splice(idx, 1);
  writeGallery(gallery);
  res.json(gallery);
});

app.listen(PORT, () => console.log(`Admin API running at http://localhost:${PORT}`));
