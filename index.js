import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import multer from 'multer';
import { estimateJob } from './services/estimator.js';
import { optimizeVendorsForBOM } from './services/optimizer.js';
import { db } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Upload & storage configuration ------------------------------------------------
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(__dirname, process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../uploads');
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || '10');
const MAX_UPLOAD_BYTES = Math.max(1, MAX_UPLOAD_MB) * 1024 * 1024;
const MAX_ESTIMATE_PHOTOS = Number(process.env.MAX_ESTIMATE_PHOTOS || '5');
const MAX_ESTIMATE_DOCS = Number(process.env.MAX_ESTIMATE_DOCS || '3');

if (STORAGE_DRIVER !== 'local') {
  console.warn(`[Fixpert] STORAGE_DRIVER "${STORAGE_DRIVER}" non supportato, uso fallback locale`);
}

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: MAX_ESTIMATE_PHOTOS + MAX_ESTIMATE_DOCS + 5
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }
    cb(null, true);
  }
});

const flattenUploadedFiles = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  return Object.values(files).flat();
};

async function cleanupUploadedFiles(files = []) {
  await Promise.all(files.map(f => {
    if (!f?.path) return Promise.resolve();
    return fsPromises.unlink(f.path).catch(() => {});
  }));
}

const buildAttachmentRecord = (entityId, kind, file) => ({
  id: uuidv4(),
  entity_type: 'request',
  entity_id: entityId,
  kind,
  filename: file.filename,
  original_name: file.originalname,
  mime_type: file.mimetype,
  size: file.size,
  url: `/uploads/${file.filename}`,
  metadata: { field: file.fieldname }
});

const estimateUpload = upload.fields([
  { name: 'photos', maxCount: MAX_ESTIMATE_PHOTOS },
  { name: 'documents', maxCount: MAX_ESTIMATE_DOCS }
]);

// Trust proxy (for rate limiting and HTTPS headers behind proxies)
app.set('trust proxy', 1);

// Disable x-powered-by
app.disable('x-powered-by');

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // frontend uses inline handlers and external fonts
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS policy
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || undefined; // default reflects request origin
app.use(cors({
  origin: ALLOWED_ORIGIN || true,
  credentials: false,
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.text({ type: ['text/plain', 'text/csv'], limit: '5mb' }));

// Rate limiting (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to API after parsers
app.use('/api/', limiter);

// Compression
app.use(compression());

app.use('/uploads', express.static(UPLOADS_DIR, {
  index: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Admin: import offers (CSV or JSON). Header x-admin-token required.
app.post('/api/admin/offers/import', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TOKEN || 'admin123';
    if (!token || token !== expected) return res.status(401).json({ error: 'unauthorized' });

    const ct = req.headers['content-type'] || '';
    let offers = [];
    if (ct.includes('application/json')) {
      const body = req.body || {};
      offers = Array.isArray(body) ? body : (body.offers || []);
    } else {
      const csv = typeof req.body === 'string' ? req.body : '';
      offers = parseCSVOffers(csv);
    }
    if (!Array.isArray(offers) || offers.length === 0) return res.status(400).json({ error: 'no offers provided' });
    await db.upsertOffers(offers);
    res.json({ ok: true, imported: offers.length });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'import failed' });
  }
});

function parseCSVOffers(csv) {
  const lines = (csv || '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(s => s.trim().toLowerCase());
  const idx = (k) => header.indexOf(k);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const r = {
      sku: cols[idx('sku')]?.trim(),
      name: cols[idx('name')]?.trim(),
      category: cols[idx('category')]?.trim(),
      unit: cols[idx('unit')]?.trim(),
      price: Number(cols[idx('price')] || 0),
      vendor: cols[idx('vendor')]?.trim(),
      brand: cols[idx('brand')]?.trim() || null,
      currency: cols[idx('currency')]?.trim() || 'EUR',
      pack_size: cols[idx('pack_size')]?.trim() || null,
      availability: cols[idx('availability')]?.trim() || null,
      lead_time_days: cols[idx('lead_time_days')] ? Number(cols[idx('lead_time_days')]) : null,
    };
    if (r.sku && r.name && r.category && r.unit && r.vendor && r.price > 0) rows.push(r);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.replace(/^\s+|\s+$/g, ''));
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smart-trades-platform', time: new Date().toISOString() });
});

app.post('/api/diagnostics', (req, res) => {
  const { jobType, description } = req.body || {};
  if (!jobType) return res.status(400).json({ error: 'jobType is required' });
  const base = {
    electrical: [
      'Verifica quadro elettrico e differenziale (salvavita)',
      'Controlla sezioni cavi e protezioni magnetotermiche',
      'Mappa punti luce e prese: quantità e distanze',
      'Valuta canaline vs tracce a muro',
    ],
    plumbing: [
      'Individua punto di perdita e chiusure rubinetti/intercettazioni',
      'Verifica pressione rete e stato flessibili/guarnizioni',
      'Valuta percorso tubazioni e accessibilità sifoni',
    ],
    hvac: [
      'Verifica potenza termica/BTU adeguata all\'ambiente',
      'Controlla scarico condensa e alimentazione elettrica',
    ],
    masonry: [
      'Valuta stato strutturale muri e fondazioni',
      'Verifica umidità e crepe esistenti',
      'Controlla planarità e squadro pareti',
      'Valuta permessi edilizi necessari',
    ],
    painting: [
      'Analisi stato pareti e soffitti',
      'Verifica presenza umidità o muffa',
      'Valuta primer necessario per superfici',
      'Misura aree da trattare',
    ],
    flooring: [
      'Controllo planarità e stato sottofondo',
      'Verifica umidità massetto',
      'Misura dislivelli e irregolarità',
      'Valuta tipo pavimentazione esistente',
    ],
    roofing: [
      'Ispezione copertura e stato tegole',
      'Verifica grondaie e scarichi pluviali',
      'Controllo impermeabilizzazione sottotetto',
      'Valuta pendenza e ventilazione tetto',
      'Permessi comunali per lavori su tetto',
    ],
    landscaping: [
      'Analisi terreno e drenaggio',
      'Progettazione layout giardino',
      'Verifica impianti irrigazione esistenti',
      'Scelta piante adeguate al clima',
      'Permessi per modifiche esterne',
    ],
    pools: [
      'Verifica terreno e portanza per piscina',
      'Progettazione forma e profondità vasca',
      'Impianti filtrazione e circolazione',
      'Sistema elettrico e illuminazione',
      'Permessi edilizi e normative piscine',
    ],
    renovations: [
      'Valutazione stato strutturale edificio',
      'Progettazione interventi e fasi',
      'Verifica impianti esistenti',
      'Coordinamento sicurezza e permessi',
      'Pianificazione materiali e logistica',
    ],
    general: [
      'Foto ambienti e misure principali (lunghezza x larghezza x altezza)',
      'Stato finiture: pareti, pavimento, controsoffitti',
      'Vincoli condominiali o normative locali',
    ],
  };
  const checklist = [...(base[jobType] || []), ...base.general];
  res.json({ checklist, notes: description || '' });
});

app.post('/api/estimate', (req, res, next) => {
  estimateUpload(req, res, async (err) => {
    if (err) {
      await cleanupUploadedFiles(flattenUploadedFiles(req.files));
      return res.status(400).json({ error: err.message || 'Upload non valido' });
    }
    next();
  });
}, async (req, res) => {
  const uploadedFiles = flattenUploadedFiles(req.files);
  try {
    const body = req.body || {};
    const validTypes = ['electrical','plumbing','hvac','masonry','painting','flooring','roofing','landscaping','pools','renovations'];
    const jobType = String(body.jobType || '').trim();
    if (!jobType || !validTypes.includes(jobType)) {
      await cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: 'Invalid jobType' });
    }

    const parseNumber = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : NaN;
    };

    const areaM2Raw = parseNumber(body.areaM2);
    if (body.areaM2 !== undefined && body.areaM2 !== '' && !Number.isFinite(areaM2Raw)) {
      await cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: 'Invalid areaM2' });
    }

    const roomsRaw = parseNumber(body.rooms);
    if (body.rooms !== undefined && body.rooms !== '' && !Number.isFinite(roomsRaw)) {
      await cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: 'Invalid rooms' });
    }

    const payload = {
      jobType,
      areaM2: Number.isFinite(areaM2Raw) ? areaM2Raw : undefined,
      rooms: Number.isFinite(roomsRaw) ? roomsRaw : undefined,
      urgency: body.urgency || 'normal',
      materialsPref: body.materialsPref || 'standard',
      description: body.description || ''
    };

    const result = await estimateJob(payload);
    const id = uuidv4();

    const timestamp = new Date().toISOString();
    const requestRecord = {
      id,
      createdAt: timestamp,
      payload: {
        ...payload,
        areaM2: result?.summary?.areaM2 ?? payload.areaM2 ?? 20,
        rooms: result?.summary?.rooms ?? payload.rooms ?? 1
      },
      estimate: result,
      status: 'pending_quotes'
    };

    await db.createRequest(requestRecord);

    const attachments = [];
    const photoFiles = (req.files?.photos || []).map(file => buildAttachmentRecord(id, 'photo', file));
    const documentFiles = (req.files?.documents || []).map(file => buildAttachmentRecord(id, 'document', file));
    attachments.push(...photoFiles, ...documentFiles);

    if (attachments.length) {
      await db.createAttachments(attachments);
    }

    const grouped = attachments.reduce((acc, att) => {
      const key = att.kind || 'general';
      acc[key] = acc[key] || [];
      acc[key].push({
        id: att.id,
        url: att.url,
        name: att.original_name,
        mimeType: att.mime_type,
        size: att.size
      });
      return acc;
    }, {});

    res.json({ requestId: id, ...requestRecord, attachments: grouped });
  } catch (e) {
    console.error(e);
    await cleanupUploadedFiles(uploadedFiles);
    res.status(400).json({ error: e.message || 'Estimation failed' });
  }
});

app.post('/api/uploads', upload.array('files', MAX_ESTIMATE_PHOTOS + MAX_ESTIMATE_DOCS + 5), async (req, res) => {
  try {
    const { entityType, entityId, kind } = req.body || {};
    if (!entityType || !entityId) {
      await cleanupUploadedFiles(req.files || []);
      return res.status(400).json({ error: 'entityType e entityId sono obbligatori' });
    }

    const records = (req.files || []).map(file => ({
      id: uuidv4(),
      entity_type: String(entityType),
      entity_id: String(entityId),
      kind: kind || file.fieldname || 'general',
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      metadata: { field: file.fieldname }
    }));

    if (!records.length) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    await db.createAttachments(records);

    res.json({
      ok: true,
      attachments: records.map(att => ({
        id: att.id,
        url: att.url,
        name: att.original_name,
        mimeType: att.mime_type,
        size: att.size,
        kind: att.kind
      }))
    });
  } catch (e) {
    console.error(e);
    await cleanupUploadedFiles(req.files || []);
    res.status(400).json({ error: e.message || 'Upload failed' });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const requests = await db.getRequests();
    res.json({ requests });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.post('/api/quotes/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await db.getRequest(requestId);
    if (!request) return res.status(404).json({ error: 'request not found' });

    const total = Number(req.body?.total);
    if (!Number.isFinite(total) || total <= 0 || total > 1_000_000) {
      return res.status(400).json({ error: 'Invalid total' });
    }
    const quote = { total, id: uuidv4(), createdAt: new Date().toISOString() };
    await db.createQuote(requestId, quote);
    res.json({ ok: true, quote });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

app.get('/api/quotes/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const quotes = await db.getQuotesForRequest(requestId);
    res.json({ quotes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

app.get('/api/deals', async (req, res) => {
  try {
    const { category } = req.query;
    const suppliers = await db.getSuppliers(category);
    res.json({ deals: suppliers.slice(0, 50) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.post('/api/optimize/materials', async (req, res) => {
  try {
    const { bom } = req.body || {};
    if (!Array.isArray(bom)) return res.status(400).json({ error: 'bom array is required' });

    // Get suppliers from database
    const allSuppliers = await db.getSuppliers();
    const result = optimizeVendorsForBOM(bom, allSuppliers);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'Optimization failed' });
  }
});

// Auth helpers
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role, name, phone, location } = req.body || {};
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' });
    const existing = await db.getUser(email);
    if (existing) return res.status(400).json({ error: 'email already exists' });
    const user = await db.createUser({
      email,
      passwordHash: hashPassword(password),
      role,
      name,
      phone,
      location,
    });
    res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await db.getUser(email);
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'login failed' });
  }
});

// Companies endpoints
app.post('/api/companies', async (req, res) => {
  try {
    const { userId, name, description, services, photos, certifications, links, location } = req.body || {};
    if (!userId || !name) return res.status(400).json({ error: 'userId and name required' });
    const company = await db.createCompany({ userId, name, description, services, photos, certifications, links, location });
    res.json({ ok: true, company });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'company creation failed' });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateCompany(id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'company not found' });
    res.json({ ok: true, company: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'company update failed' });
  }
});

app.get('/api/companies', async (_req, res) => {
  try {
    const companies = await db.getCompanies();
    res.json({ companies });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch companies' });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const company = await db.getCompany(req.params.id);
    if (!company) return res.status(404).json({ error: 'company not found' });
    const reviews = await db.getReviewsForCompany(req.params.id);
    res.json({ company, reviews });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch company' });
  }
});

// Reviews endpoints
app.post('/api/reviews', async (req, res) => {
  try {
    const { companyId, userId, rating, comment } = req.body || {};
    if (!companyId || !userId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'companyId, userId and rating 1-5 required' });
    }
    const review = await db.createReview({ companyId, userId, rating, comment });
    res.json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message || 'review creation failed' });
  }
});

app.get('/api/companies/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.getReviewsForCompany(req.params.id);
    res.json({ reviews });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch reviews' });
  }
});

// Serve static frontend from ../web
const webRoot = path.resolve(__dirname, '../web');
app.use(express.static(webRoot, { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, etag: true }));
app.get('*', (req, res) => {
  res.sendFile(path.join(webRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
