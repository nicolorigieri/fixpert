const API = (() => {
  try {
    const params = new URLSearchParams(location.search);
    const paramOverride = params.get('api');
    if (paramOverride) {
      const cleaned = paramOverride.replace(/\/$/, '');
      localStorage.setItem('fixpert_api_base', cleaned);
      return cleaned;
    }

    const stored = localStorage.getItem('fixpert_api_base');
    if (stored) {
      return stored.replace(/\/$/, '');
    }

    const globalOverride = (window && window.FIXPERT_API_BASE) ? String(window.FIXPERT_API_BASE) : '';
    if (globalOverride) {
      return globalOverride.replace(/\/$/, '');
    }

    const meta = document.querySelector('meta[name="api-base"]')?.content?.trim();
    if (meta) {
      const normalizedMeta = meta.replace(/\/$/, '');
      const isLocal = /^https?:\/\/localhost(:\d+)?$/i.test(location.origin || '');
      if (isLocal && !/^https?:\/\/localhost/i.test(normalizedMeta)) {
        return location.origin.replace(/\/$/, '');
      }
      return normalizedMeta;
    }

    if (location.origin && location.origin !== 'null' && location.origin !== 'file://') {
      return location.origin.replace(/\/$/, '');
    }

    return 'http://localhost:3001';
  }
  catch (e) {
    return 'http://localhost:3001';
  }
})();
const $ = (s, r = document) => r.querySelector(s);
const el = (t, a = {}, c = []) => { const e = document.createElement(t); for (const k in a) (k==='class')?e.className=a[k]:e.setAttribute(k,a[k]); c.forEach(ch=>e.append(ch)); return e; };
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

// --- Modalità demo/offline -------------------------------------------------------
const OFFLINE = { active: false, notified: false };

const OFFLINE_DATA = {
  deals: [
    { sku: 'demo-ele-quad', name: 'Quadro elettrico smart', category: 'electrical', vendor: 'VoltPro', unit: 'pz', price: 490 },
    { sku: 'demo-plu-kit', name: 'Kit tubi multistrato', category: 'plumbing', vendor: 'AquaLine', unit: 'kit', price: 185 },
    { sku: 'demo-roof-tile', name: 'Tegole ventilate XL', category: 'roofing', vendor: 'RoofShield', unit: 'mq', price: 29 },
    { sku: 'demo-masonry-cem', name: 'Cemento strutturale R52', category: 'masonry', vendor: 'BuildMix', unit: 'sacco', price: 12 },
    { sku: 'demo-land-green', name: 'Tappeto erboso premium', category: 'landscaping', vendor: 'GreenScape', unit: 'mq', price: 17 },
    { sku: 'demo-pool-pump', name: 'Pompa filtrante silenziata', category: 'pools', vendor: 'BlueWave', unit: 'pz', price: 640 },
    { sku: 'demo-reno-pack', name: 'Pacchetto ristrutturazione base', category: 'renovations', vendor: 'FixItAll', unit: 'mq', price: 98 }
  ],
  diagnosticsBase: [
    'Scatta foto aggiornate delle aree di intervento',
    'Definisci tempistiche desiderate e budget indicativo',
    'Verifica eventuali vincoli condominiali o comunali'
  ],
  diagnosticsExtra: {
    electrical: [
      'Controlla quadro elettrico e dispositivi di protezione',
      'Mappa prese e punti luce necessari',
      'Valuta predisposizione domotica e smart home'
    ],
    plumbing: [
      'Cerca eventuali perdite visibili',
      'Verifica pressione e presenza di calcare',
      'Pianifica la sostituzione di rubinetteria vecchia'
    ],
    roofing: [
      'Ispeziona tegole e impermeabilizzazione',
      'Pulisci grondaie e pluviali',
      'Valuta isolamento del sottotetto'
    ],
    masonry: [
      'Controlla eventuali crepe e infiltrazioni',
      'Valuta la portanza delle strutture',
      'Analizza eventuale umidità di risalita'
    ],
    landscaping: [
      'Rileva metrature precise del giardino',
      'Verifica impianto di irrigazione',
      'Scegli piante adatte al clima locale'
    ],
    pools: [
      'Analizza esposizione al sole e collegamenti idrici',
      'Controlla impianto di filtrazione',
      'Verifica normative di sicurezza vigenti'
    ],
    renovations: [
      'Definisci il cronoprogramma lavori',
      'Coordina impianti e finiture',
      'Pianifica materiali per evitare ritardi'
    ]
  },
  estimatePresets: {
    electrical: { materialPerM2: 52, laborPerM2: 28, perRoom: 150, overhead: 0.18, hrsPerM2: 0.22 },
    plumbing: { materialPerM2: 34, laborPerM2: 24, perRoom: 120, overhead: 0.16, hrsPerM2: 0.18 },
    roofing: { materialPerM2: 42, laborPerM2: 26, perRoom: 60, overhead: 0.17, hrsPerM2: 0.21 },
    masonry: { materialPerM2: 48, laborPerM2: 30, perRoom: 100, overhead: 0.19, hrsPerM2: 0.25 },
    landscaping: { materialPerM2: 24, laborPerM2: 15, perRoom: 30, overhead: 0.12, hrsPerM2: 0.12 },
    pools: { materialPerM2: 70, laborPerM2: 34, perRoom: 190, overhead: 0.2, hrsPerM2: 0.3 },
    renovations: { materialPerM2: 60, laborPerM2: 36, perRoom: 170, overhead: 0.22, hrsPerM2: 0.32 }
  },
  companies: [
    {
      id: '201',
      name: 'Impianti Rossi Srl',
      location: 'Milano',
      rating_avg: 4.8,
      services: JSON.stringify(['Impianti elettrici','Domotica','Fotovoltaico']),
      links: JSON.stringify(['https://impiantirossi.example']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80']),
      certifications: JSON.stringify(['SOA','ISO 9001']),
      description: 'Specialisti in impianti civili e industriali con soluzioni smart e monitoraggio remoto.',
      email: 'contatti@impiantirossi.it',
      phone: '+39 02 1234 5678',
      created_at: '2025-01-15T08:00:00.000Z'
    },
    {
      id: '202',
      name: 'AquaLine Idraulica',
      location: 'Bergamo',
      rating_avg: 4.6,
      services: JSON.stringify(['Idraulica','Climatizzazione','Caldaie']),
      links: JSON.stringify(['https://aqualine.example']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=600&q=80']),
      certifications: JSON.stringify(['F-Gas','FER']),
      description: 'Impianti idraulici con assistenza H24 e monitoraggio perdite.',
      email: 'info@aqualine.it',
      phone: '+39 035 9876543',
      created_at: '2025-02-01T08:00:00.000Z'
    },
    {
      id: '203',
      name: 'BuildMix Costruzioni',
      location: 'Torino',
      rating_avg: 4.7,
      services: JSON.stringify(['Ristrutturazioni','Interior design','Gestione cantieri']),
      links: JSON.stringify(['https://buildmix.example','https://instagram.com/buildmix']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80']),
      certifications: JSON.stringify(['SOA','CAM']),
      description: 'Team multidisciplinare per ristrutturazioni chiavi in mano e gestione pratiche.',
      email: 'hello@buildmix.it',
      phone: '+39 011 7654321',
      created_at: '2025-03-12T08:00:00.000Z'
    }
  ],
  reviews: generateDemoReviews(),
  requests: generateDemoRequests(),
  users: [
    { id: 'u-demo', email: 'demo@fixpert.it', password: 'demo123', role: 'client', name: 'Cliente Demo' },
    { id: 'u-azienda', email: 'azienda@fixpert.it', password: 'demo123', role: 'business', name: 'Azienda Demo' }
  ]
};

const OFFLINE_STATE = {
  deals: [...OFFLINE_DATA.deals],
  companies: [...OFFLINE_DATA.companies],
  reviews: JSON.parse(JSON.stringify(OFFLINE_DATA.reviews)),
  requests: [...OFFLINE_DATA.requests],
  users: [...OFFLINE_DATA.users],
  sessions: new Map()
};

function enableOfflineDemo() {
  if (OFFLINE.active) return;
  OFFLINE.active = true;
  document.body?.setAttribute('data-offline', 'true');
  console.warn('[Fixpert] Modalità demo offline attiva');
  if (!OFFLINE.notified) {
    OFFLINE.notified = true;
    toast('Modalità demo attiva: dati di esempio caricati', 'error');
  }
}

function clone(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}

function generateDemoReviews(){
  const sentences = [
    'Team professionale e puntuale.',
    'Ottimo rapporto qualità-prezzo.',
    'Comunicazione costante durante i lavori.',
    'Consigliatissimi per interventi complessi.',
    'Materiali di ottima qualità.'
  ];
  const ratings = [5,4,5,5,4,5];
  const make = (companyId, count=2)=>Array.from({length:count}).map((_,i)=>({
    rating: ratings[(companyId.charCodeAt(0)+i)%ratings.length],
    comment: sentences[(companyId.charCodeAt(1)+i)%sentences.length],
    created_at: new Date(Date.now()- (i+1)*86400000*6).toISOString()
  }));
  return {
    '201': make('201',3),
    '202': make('202',2),
    '203': make('203',3)
  };
}

function generateDemoRequests(){
  const types = ['electrical','plumbing','renovations','roofing'];
  return Array.from({length:4}).map((_,i)=>({
    id: `demo-req-${i+1}`,
    createdAt: new Date(Date.now()-i*86400000*4).toISOString(),
    payload: {
      jobType: types[i%types.length],
      areaM2: 60 + i*15,
      rooms: 3 + i
    }
  }));
}

function offlineDiagnostics(payload) {
  const type = String(payload?.jobType || '').toLowerCase();
  const extra = OFFLINE_DATA.diagnosticsExtra[type] || OFFLINE_DATA.diagnosticsExtra.renovations || [];
  return { checklist: [...OFFLINE_DATA.diagnosticsBase, ...extra], notes: payload?.description || '' };
}

function offlineEstimate(payload) {
  const base = OFFLINE_DATA.estimatePresets[payload?.jobType] || OFFLINE_DATA.estimatePresets.renovations;
  const area = Math.max(1, Number(payload?.areaM2) || 20);
  const rooms = Math.max(1, Number(payload?.rooms) || 1);
  const materials = Math.round(base.materialPerM2 * area + rooms * 35);
  const labor = Math.round(base.laborPerM2 * area + rooms * 20);
  const overhead = Math.round((materials + labor) * base.overhead);
  const total = materials + labor + overhead;
  const hours = Math.round(area * base.hrsPerM2 + rooms * 6);
  const bom = [
    { name: 'Materiali principali', qty: area, unit: 'mq', unitPrice: Math.round(base.materialPerM2), lineTotal: materials },
    { name: 'Manodopera specializzata', qty: hours, unit: 'h', unitPrice: Math.max(20, Math.round(labor / Math.max(1, hours))), lineTotal: labor },
    { name: 'Forniture e logistica', qty: rooms, unit: 'pz', unitPrice: Math.round(overhead / Math.max(1, rooms)), lineTotal: overhead }
  ];
  const suggestions = offlineDiagnostics(payload).checklist.slice(0, 3);
  return {
    requestId: `demo-${Date.now()}`,
    estimate: {
      bom,
      costs: { materials, labor, overhead, total },
      time: { hours, days: Math.max(1, Math.ceil(hours / 8)) },
      suggestions
    }
  };
}

function offlineDeals(category) {
  if (!category) return clone(OFFLINE_STATE.deals);
  return clone(OFFLINE_STATE.deals.filter(d => d.category === category));
}

function offlineRequests() {
  return clone(OFFLINE_STATE.requests);
}

function offlineCompanies() {
  return clone(OFFLINE_STATE.companies);
}

function offlineCompanyDetails(id) {
  const company = OFFLINE_STATE.companies.find(c => String(c.id) === String(id));
  if (!company) return null;
  const reviews = clone(OFFLINE_STATE.reviews[id] || []);
  return { company: clone(company), reviews };
}

function addOfflineReview(payload) {
  const { companyId, rating, comment, userId } = payload || {};
  const target = OFFLINE_STATE.reviews[companyId] || (OFFLINE_STATE.reviews[companyId] = []);
  target.unshift({ rating: Number(rating) || 5, comment: comment || 'Esperienza positiva', created_at: new Date().toISOString(), userId });
  return { ok: true };
}

function ensureOfflineUser(payload) {
  const { email, password, role, name } = payload || {};
  if (!email || !password || !role) throw new Error('Campi obbligatori mancanti');
  const exists = OFFLINE_STATE.users.find(u => u.email === email);
  if (exists) throw new Error('Email già registrata (demo)');
  const user = { id: `u-${Date.now()}`, email, password, role, name: name || email.split('@')[0] };
  OFFLINE_STATE.users.push(user);
  return { ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
}

function loginOffline(payload) {
  const { email, password } = payload || {};
  const user = OFFLINE_STATE.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Credenziali non valide (demo)');
  return { ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
}

function offlineOptimize(bom = []) {
  const bundles = bom.map(item => {
    const sku = inferSku(item.name);
    const deal = OFFLINE_STATE.deals.find(d => d.sku.includes(sku)) || OFFLINE_STATE.deals[0];
    const qty = Number(item.qty) || 1;
    const price = deal ? deal.price : 50;
    return {
      vendor: deal?.vendor || 'Fornitore Demo',
      items: [{ name: item.name, qty, chosen: { price } }],
      cost: Math.round(price * qty)
    };
  });
  const total = bundles.reduce((sum, b) => sum + b.cost, 0);
  return { total, bundles };
}

const nativeFetch = window.fetch.bind(window);

window.fetch = async function patchedFetch(resource, options = {}) {
  const url = typeof resource === 'string' ? resource : resource.url;
  const isAPIRequest = typeof url === 'string' && url.startsWith(API + '/api/');
  try {
    const res = await nativeFetch(resource, options);
    if (isAPIRequest && res.ok) {
      document.body?.removeAttribute('data-offline');
      OFFLINE.active = false;
    }
    if (!isAPIRequest || res.ok) return res;
    // API ha risposto con errore -> prova fallback
    throw new Error('API error ' + res.status);
  } catch (err) {
    if (!isAPIRequest) throw err;
    enableOfflineDemo();
    const offlineRes = offlineResponse(url, options, err);
    if (offlineRes) return offlineRes;
    throw err;
  }
};

function offlineResponse(url, options, originalError) {
  let data = null;
  let status = 200;
  let pathname = '';
  try {
    const parsed = new URL(url);
    pathname = parsed.pathname.replace(/^\/api\//, '');
    const method = (options?.method || 'GET').toUpperCase();
    const body = typeof options?.body === 'string' ? JSON.parse(options.body) : null;
    if (pathname.startsWith('diagnostics') && method === 'POST') {
      data = offlineDiagnostics(body);
    } else if (pathname.startsWith('estimate') && method === 'POST') {
      data = offlineEstimate(body);
    } else if (pathname.startsWith('deals') && method === 'GET') {
      const category = parsed.searchParams.get('category');
      data = { deals: offlineDeals(category) };
    } else if (pathname.startsWith('requests') && method === 'GET') {
      data = { requests: offlineRequests() };
    } else if (pathname.startsWith('quotes/') && method === 'POST') {
      data = { ok: true, quote: { id: 'offline-quote', total: Number(JSON.parse(options.body || '{}').total) || 100 } };
    } else if (pathname === 'optimize/materials' && method === 'POST') {
      data = offlineOptimize(body?.bom || []);
    } else if (pathname === 'companies' && method === 'GET') {
      data = { companies: offlineCompanies() };
    } else if (/^companies\/[\w-]+$/.test(pathname) && method === 'GET') {
      const id = pathname.split('/')[1];
      const company = offlineCompanyDetails(id);
      if (!company) { status = 404; data = { error: 'Company not found (demo)' }; }
      else data = company;
    } else if (/^companies\/[\w-]+\/reviews$/.test(pathname) && method === 'GET') {
      const id = pathname.split('/')[1];
      data = { reviews: clone(OFFLINE_STATE.reviews[id] || []) };
    } else if (pathname === 'reviews' && method === 'POST') {
      data = addOfflineReview(body);
    } else if (pathname === 'auth/register' && method === 'POST') {
      data = ensureOfflineUser(body);
    } else if (pathname === 'auth/login' && method === 'POST') {
      data = loginOffline(body);
    } else if (pathname === 'companies' && method === 'POST') {
      const userId = body?.userId;
      if (!userId) throw new Error('userId obbligatorio');
      const company = { ...body, id: `comp-${Date.now()}` };
      OFFLINE_STATE.companies.push(company);
      data = { ok: true, company };
    } else if (/^companies\//.test(pathname) && method === 'PUT') {
      const id = pathname.split('/')[1];
      const idx = OFFLINE_STATE.companies.findIndex(c => String(c.id) === String(id));
      if (idx >= 0) {
        OFFLINE_STATE.companies[idx] = { ...OFFLINE_STATE.companies[idx], ...body };
        data = { ok: true, company: OFFLINE_STATE.companies[idx] };
      } else {
        status = 404;
        data = { error: 'Company not found (demo)' };
      }
    }
  } catch (e) {
    console.warn('[Fixpert] fallback offline non riuscito', e);
    data = { error: originalError?.message || 'Offline non disponibile' };
    status = 500;
  }
  if (data == null) return null;
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function ensureToast(){ let t=document.getElementById('toast'); if(!t){ t=document.createElement('div'); t.id='toast'; t.className='toast'; t.setAttribute('role','status'); t.setAttribute('aria-live','polite'); t.setAttribute('aria-atomic','true'); document.body.appendChild(t);} return t; }

// --- Dynamic materials counter ("60+") ---
function initMaterialsCount(){
  try{
    const el = document.getElementById('materials-count');
    if(!el) return;
    const params = new URLSearchParams(location.search);
    const override = params.get('materials') || localStorage.getItem('materialsCount');
    let count = Number(override);
    if(Number.isFinite(count) && count > 0){ el.textContent = `${count}+`; return; }
    // If a global list exists, use its size
    const list = Array.isArray(window.__materialsList) ? window.__materialsList : [];
    if(list.length){ el.textContent = `${list.length}+`; return; }
    // default stays as-is (60+ in HTML)
  }catch{}
}

async function updateReviewCount(companyId){
  try{
    const btn = document.getElementById(`btn-reviews-${companyId}`);
    if(!btn) return;
    const r = await fetch(`${API}/api/companies/${companyId}`);
    const data = await r.json();
    const n = (data.reviews||[]).length;
    btn.textContent = n ? `Vedi recensioni (${n})` : 'Vedi recensioni (0)';
  }catch{}
}

async function contactCompany(companyId){
  try{
    const r = await fetch(`${API}/api/companies/${companyId}`);
    const data = await r.json();
    const c = data.company||{};
    // Try to find an email in links (mailto:)
    let links = [];
    try{ links = c.links? JSON.parse(c.links): []; }catch{}
    const mail = links.find(l=>/^mailto:/i.test(String(l)));
    if(mail){ window.location.href = mail; return; }
    // Fallback: open assistant panel
    const panel = document.getElementById('assistant-panel');
    if(panel){ panel.style.display='block'; toast('Nessuna email trovata: usa l\'assistente per inviare una richiesta','success'); }
  }catch(e){ toast('Impossibile contattare: riprova','error'); }
}

// --- Social Feed ---
function renderStars(n){
  const x=Math.max(0,Math.min(5,Number(n)||0));
  const full = Math.round(x);
  const star = (filled)=>`<svg viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" width="16" height="16"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192L12 .587z"/></svg>`;
  return `<span class="stars">${Array.from({length:5}).map((_,i)=>star(i<full)).join('')}</span>`;
}

function initSocial(){
  const btn = document.getElementById('btn-load-social');
  const form = document.getElementById('form-review');
  const fLoc = document.getElementById('social-filter-location');
  const fServ = document.getElementById('social-filter-service');
  const fSort = document.getElementById('social-sort');
  const fVerified = document.getElementById('social-only-verified');
  const fNearMe = document.getElementById('social-near-me');
  const fTop = document.getElementById('social-only-top');
  const fNew = document.getElementById('social-only-new');
  if(btn){ btn.onclick = loadSocialFeed; }
  if(form){ form.onsubmit = onSubmitReview; }
  if(fLoc) fLoc.oninput = renderSocialList;
  if(fServ) fServ.oninput = renderSocialList;
  if(fSort) fSort.onchange = renderSocialList;
  if(fVerified) fVerified.onchange = renderSocialList;
  if(fNearMe) fNearMe.onchange = renderSocialList;
  if(fTop) fTop.onchange = renderSocialList;
  if(fNew) fNew.onchange = renderSocialList;
}

async function loadSocialFeed(){
  const box = document.getElementById('social-feed');
  if(!box) return;
  box.innerHTML = skeletonCards(6);
  try{
    const res = await fetch(API+'/api/companies');
    const data = await res.json();
    const base = data.companies||[];
    // Prefetch review counts for sorting by number of reviews
    const withCounts = await Promise.all(base.map(async c=>{
      try{
        const r = await fetch(`${API}/api/companies/${c.id}`).then(x=>x.json());
        c._reviewsCount = Array.isArray(r.reviews)? r.reviews.length : 0;
      }catch{ c._reviewsCount = 0; }
      return c;
    }));
    window.__socialCompanies = withCounts;
    renderSocialList();
  }catch(e){ box.innerHTML = '<em>Errore nel caricamento del feed</em>'; }
}

function renderSocialList(){
  const list = (window.__socialCompanies||[]).slice();
  const box = document.getElementById('social-feed');
  if(!box) return;
  const fLoc = (document.getElementById('social-filter-location')?.value||'').toLowerCase().trim();
  const fServ = (document.getElementById('social-filter-service')?.value||'').toLowerCase().trim();
  const sort = document.getElementById('social-sort')?.value||'rating_desc';
  const onlyVerified = !!document.getElementById('social-only-verified')?.checked;
  const nearMe = !!document.getElementById('social-near-me')?.checked;
  const onlyTop = !!document.getElementById('social-only-top')?.checked;
  const onlyNew = !!document.getElementById('social-only-new')?.checked;
  let myLoc = '';
  try{ myLoc = (getSession()?.user?.location||'').toLowerCase().trim(); }catch{}
  if(!myLoc){
    const regLoc = document.querySelector('#form-register [name="location"]')?.value || '';
    myLoc = regLoc.toLowerCase().trim();
  }
  let out = list.filter(c=>{
    let ok = true;
    if(fLoc){ ok = ok && String(c.location||'').toLowerCase().includes(fLoc); }
    if(fServ){ try{ const s = c.services?JSON.parse(c.services):[]; ok = ok && s.some(x=>String(x).toLowerCase().includes(fServ)); }catch{ ok=false; } }
    if(onlyVerified){ try{ const certs = c.certifications?JSON.parse(c.certifications):[]; ok = ok && certs.length>0; }catch{ ok=false; } }
    if(nearMe && myLoc){ ok = ok && String(c.location||'').toLowerCase().includes(myLoc); }
    if(onlyTop){ ok = ok && Number(c.rating_avg||0) >= 4.5; }
    if(onlyNew){ const d=c.created_at||c.createdAt; const t=Date.parse(d||''); ok = ok && !isNaN(t) && (Date.now()-t) < 14*24*60*60*1000; }
    return ok;
  });
  out.sort((a,b)=>{
    if(sort==='rating_desc') return (b.rating_avg||0)-(a.rating_avg||0);
    if(sort==='rating_asc') return (a.rating_avg||0)-(b.rating_avg||0);
    if(sort==='reviews_desc') return (b._reviewsCount||0)-(a._reviewsCount||0);
    if(sort==='reviews_asc') return (a._reviewsCount||0)-(b._reviewsCount||0);
    if(sort==='verified_first'){
      const av = (()=>{ try{ const c=a.certifications?JSON.parse(a.certifications):[]; return c.length>0; }catch{ return false; }})();
      const bv = (()=>{ try{ const c=b.certifications?JSON.parse(b.certifications):[]; return c.length>0; }catch{ return false; }})();
      if(bv!==av) return bv-av; // true first
      return (b.rating_avg||0)-(a.rating_avg||0);
    }
    if(sort==='name_asc') return String(a.name||'').localeCompare(String(b.name||''));
    return 0;
  });
  if(!out.length){ box.innerHTML = '<em>Nessun risultato per i filtri applicati.</em>'; return; }
  const sliced = out.slice(0,24);
  box.innerHTML = `<div class="cards">${sliced.map(renderCompanyCard).join('')}</div>`;
  box.querySelectorAll('[data-action="see-reviews"]').forEach(btn=>{
    btn.addEventListener('click', ()=> expandReviews(btn.getAttribute('data-id')));
  });
  box.querySelectorAll('[data-action="contact"]').forEach(btn=>{
    btn.addEventListener('click', ()=> contactCompany(btn.getAttribute('data-id')));
  });
  box.querySelectorAll('[data-action="visit-profile"]').forEach(btn=>{
    btn.addEventListener('click', ()=> visitCompanyProfile(btn.getAttribute('data-id')));
  });
  // Fetch review counts asynchronously to enrich buttons
  sliced.forEach(c=>updateReviewCount(c.id));
}

async function visitCompanyProfile(companyId){
  showSection('aziende');
  try{
    const r = await fetch(`${API}/api/companies/${companyId}`).then(x=>x.json());
    if(r && r.company){ renderCompanyStatus(r.company); }
  }catch(e){ toast('Impossibile aprire il profilo','error'); }
}

function renderCompanyCard(c){
  let rating = c.rating_avg != null ? Number(c.rating_avg).toFixed(1) : '—';
  let services = [];
  try{ services = c.services? JSON.parse(c.services): []; }catch{}
  const top = Number(c.rating_avg||0) >= 4.5;
  const isNew = (()=>{ const d = c.created_at||c.createdAt; if(!d) return false; const t=Date.parse(d); if(isNaN(t)) return false; return (Date.now()-t) < 14*24*60*60*1000; })();
  const ageText = (()=>{ const d=c.created_at||c.createdAt; const t=Date.parse(d||''); if(isNaN(t)) return ''; const diff=Date.now()-t; const days=Math.floor(diff/86400000); if(days<1) return '· iscritta oggi'; if(days===1) return '· iscritta da 1 giorno'; if(days<30) return `· iscritta da ${days} giorni`; const months=Math.floor(days/30); if(months===1) return '· iscritta da 1 mese'; return `· iscritta da ${months} mesi`; })();
  const badges = `<div class="badges">${top?`<span class=\"badge badge--accent\" title=\"Azienda con valutazioni eccellenti\">🏆 Top Rated</span>`:''}${isNew?`<span class=\"badge\" title=\"Azienda appena registrata\">🆕 Nuova</span>`:''}${services.length? services.slice(0,4).map(s=>`<span class=\"badge\">${esc(s)}</span>`).join(''):''}</div>`;
  const logo = (()=>{ try{ const ph=c.photos?JSON.parse(c.photos):[]; return ph[0]; }catch{return null;} })();
  return `
    <div class="card" data-company-id="${esc(c.id)}">
      <div class="row" style="align-items:flex-start">
        <div style="display:flex;gap:12px;align-items:center">
          ${logo?`<img src="${esc(logo)}" alt="logo" style="width:48px;height:48px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb"/>`:''}
          <div>
            <div style="display:flex;align-items:center;gap:8px"><strong>${esc(c.name)}</strong> ${c.rating_avg?renderStars(c.rating_avg):''}</div>
            <div style="color:#64748b;font-size:14px">${c.location?`📍 ${esc(c.location)}`:''} ${c.rating_avg?` · ⭐ ${rating}`:''} ${typeof c._reviewsCount==='number'?` · 💬 ${c._reviewsCount}`:''} ${ageText}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary" data-action="see-reviews" data-id="${esc(c.id)}" id="btn-reviews-${esc(c.id)}">Vedi recensioni</button>
          <button class="btn-secondary" data-action="contact" data-id="${esc(c.id)}">Contatta</button>
          <button class="btn-secondary" data-action="visit-profile" data-id="${esc(c.id)}">Visita profilo</button>
        </div>
      </div>
      ${badges}
      <div id="reviews-${esc(c.id)}" class="panel" style="display:none;margin-top:12px" aria-hidden="true" aria-labelledby="btn-reviews-${esc(c.id)}"></div>
    </div>
  `;
}

async function expandReviews(companyId){
  const box = document.getElementById(`reviews-${companyId}`);
  if(!box) return;
  const visible = box.style.display !== 'none';
  if(visible){ box.style.display='none'; return; }
  box.innerHTML = skeletonLines(3);
  box.style.display='block';
  try{
    const res = await fetch(`${API}/api/companies/${companyId}/reviews`);
    const data = await res.json();
    const list = data.reviews||[];
    if(!list.length){ box.innerHTML = '<em>Nessuna recensione.</em>'; return; }
    box.innerHTML = list.slice(0,6).map(r=>
      `<div style="padding:10px 0;border-bottom:1px solid #e5e7eb">
        <div style="display:flex;align-items:center;gap:8px">${renderStars(r.rating)} <strong>${esc(r.rating)}/5</strong></div>
        <div style="color:#475569">${esc(r.comment||'')}</div>
        <div style="color:#94a3b8;font-size:12px">${esc(r.created_at||'')}</div>
      </div>`).join('');
  }catch(e){ box.innerHTML = '<em>Errore nel caricare le recensioni.</em>'; }
}

async function onSubmitReview(ev){
  ev.preventDefault();
  const sess = getSession();
  if(!sess||!sess.user){ toast('Devi effettuare il login per recensire','error'); return; }
  const f = ev.target;
  const companyId = Number(f.companyId.value);
  const rating = Number(f.rating.value);
  const comment = f.comment.value || '';
  if(!companyId || rating<1 || rating>5){ toast('Compila correttamente i campi','error'); return; }
  try{
    const r = await fetch(API+'/api/reviews',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ companyId, userId: sess.user.id, rating, comment }) }).then(r=>r.json());
    if(r.error){ throw new Error(r.error); }
    toast('Recensione inviata');
    f.reset();
    // Optional: refresh reviews panel if open
    const p = document.getElementById(`reviews-${companyId}`);
    if(p && p.style.display==='block'){ expandReviews(companyId); }
  }catch(e){ toast('Errore nell\'invio recensione','error'); }
}

// Role chooser
function getRole(){ return localStorage.getItem('fixpert_role'); }
function setRole(r){ localStorage.setItem('fixpert_role', r); }
function initRoleChooser(){
  const rc = document.getElementById('role-chooser');
  const bc = document.getElementById('choose-client');
  const bb = document.getElementById('choose-business');
  if(!rc||!bc||!bb) return;
  // Hide overlay by default
  rc.style.display = 'none';
  bc.onclick = ()=>{ setRole('client'); rc.style.display='none'; showSection('clienti'); };
  bb.onclick = ()=>{ setRole('business'); rc.style.display='none'; showSection('aziende'); };
}

// Assistant widget
function initAssistant(){
  const btn = document.getElementById('assistant-toggle');
  const panel = document.getElementById('assistant-panel');
  const close = document.getElementById('assistant-close');
  const diagnose = document.getElementById('as-diagnose');
  const estimate = document.getElementById('as-estimate');
  const out = document.getElementById('as-out');
  if(btn&&panel){ btn.onclick = ()=>{ const open = panel.style.display==='none'||panel.style.display===''; if(open){ panel.style.display='block'; enableFocusTrap(panel); const f=getFirstFocusable(panel); if(f) f.focus(); } else { panel.style.display='none'; disableFocusTrap(panel); } }; }
  if(close&&panel){ close.onclick = ()=>{ panel.style.display='none'; disableFocusTrap(panel); btn?.focus?.(); }; }
  if(diagnose&&out){ diagnose.onclick = async()=>{
    try{
      out.innerHTML = loadingHTML('Analisi e suggerimenti...');
      const payload = {
        jobType: $('#as-jobType').value,
        areaM2: Number($('#as-areaM2').value||0),
        rooms: Number($('#as-rooms').value||0),
        description: $('#as-description').value
      };
      const r = await fetch(API+'/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
      out.innerHTML = r.checklist? `<h3>Checklist</h3><ul class="list">${r.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : '<em>Nessun suggerimento</em>';
    }catch(e){ out.innerHTML=''; toast('Errore diagnostica','error'); }
  }; }
  if(estimate&&out){ estimate.onclick = async()=>{
    try{
      out.innerHTML = loadingHTML('Calcolo stima...');
      const payload = {
        jobType: $('#as-jobType').value,
        areaM2: Number($('#as-areaM2').value||0),
        rooms: Number($('#as-rooms').value||0),
        description: $('#as-description').value
      };
      const r = await fetch(API+'/api/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
      if(r.error) throw new Error(r.error);
      out.innerHTML = renderEstimate(r);
    }catch(e){ out.innerHTML=''; toast('Errore stima','error'); }
  }; }
}

// Theme (light/dark)
function getTheme(){ return localStorage.getItem('fixpert_theme') || 'light'; }
function setTheme(t){ localStorage.setItem('fixpert_theme', t); document.documentElement.setAttribute('data-theme', t); }
function toggleTheme(){ setTheme(getTheme()==='light'?'dark':'light'); }
function initTheme(){ setTheme(getTheme());
  const b1 = document.getElementById('theme-toggle-landing');
  const b2 = document.getElementById('theme-toggle-app');
  if(b1) b1.onclick = toggleTheme;
  if(b2) b2.onclick = toggleTheme;
}

// High Contrast (HC)
function getHC(){ return localStorage.getItem('fixpert_hc')||'off'; }
function setHC(v){ localStorage.setItem('fixpert_hc', v); document.documentElement.setAttribute('data-hc', v); updateHCToggles(); }
function toggleHC(){ setHC(getHC()==='on'?'off':'on'); }
function updateHCToggles(){
  const b1 = document.getElementById('hc-toggle-landing');
  const b2 = document.getElementById('hc-toggle-app');
  const on = getHC()==='on';
  if(b1){ b1.setAttribute('aria-pressed', String(on)); b1.textContent = on ? '⚫ Alto contrasto' : '⚪ Alto contrasto'; }
  if(b2){ b2.setAttribute('aria-pressed', String(on)); b2.textContent = on ? '⚫ HC' : '⚪ HC'; }
}
function initHC(){ setHC(getHC());
  const b1 = document.getElementById('hc-toggle-landing');
  const b2 = document.getElementById('hc-toggle-app');
  if(b1) b1.onclick = toggleHC;
  if(b2) b2.onclick = toggleHC;
}
function toast(msg,type='success'){ const t=ensureToast(); t.textContent=msg; t.className='toast show '+(type==='error'?'error':'success'); clearTimeout(t._hide); t._hide=setTimeout(()=>{ t.className='toast'; },2500); }
function loadingHTML(text='Caricamento...'){ return `<div class="loading">${esc(text)}</div>`; }
function skeletonLines(n=3){ return Array.from({length:n}).map(()=>`<div class="skeleton skeleton-text"></div>`).join(''); }
function skeletonCards(n=6){ return `<div class="cards">${Array.from({length:n}).map(()=>`<div class="card skeleton skeleton-card"></div>`).join('')}</div>`; }
function inferSku(name){ try{ return String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'item'; }catch{ return 'item'; } }

// Landing page navigation
function showLanding() {
  $('#landing').style.display = 'block';
  $('#main-app').style.display = 'none';
  // Hide role chooser if visible
  const rc = document.getElementById('role-chooser');
  if(rc) rc.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSection(section) {
  // Hide landing and show main app
  document.getElementById('landing').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  // If role not chosen, infer from section for CTA clicks; otherwise, show chooser only for generic sections
  const r = getRole();
  if(!r){
    if(section==='clienti'){ setRole('client'); }
    else if(section==='aziende'){ setRole('business'); }
    else {
      const rc = document.getElementById('role-chooser');
      if(rc){ rc.style.display='flex'; }
    }
  }
  document.getElementById('main-app').scrollIntoView({ behavior: 'smooth' });

  // Activate the correct tab
  document.querySelectorAll('.tab').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-selected','false'); });
  document.querySelectorAll('.tab-content').forEach(content => { content.classList.remove('active'); content.setAttribute('aria-hidden','true'); });

  const targetTab = document.querySelector(`[data-tab="${section}"]`);
  const targetContent = document.getElementById(section);

  if (targetTab && targetContent) {
    targetTab.classList.add('active');
    targetTab.setAttribute('aria-selected','true');
    targetContent.classList.add('active');
    targetContent.setAttribute('aria-hidden','false');
    targetTab.focus();
  }
}

// --- UX Advanced: Scroll Animations & Micro-interactions ---
function initScrollAnimations(){
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        // Optional: stop observing after animation
        // observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  // Observe elements with animation classes
  document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right, .animate-on-scroll-scale').forEach(el=>{
    observer.observe(el);
  });
}

function initRippleEffect(){
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.btn-primary, .btn-secondary');
    if(!btn) return;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size/2;
    const y = e.clientY - rect.top - size/2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    btn.appendChild(ripple);
    setTimeout(()=>ripple.remove(), 600);
  });
}

function initParallaxHero(){
  const hero = document.querySelector('.hero-image');
  if(!hero) return;
  
  window.addEventListener('scroll', ()=>{
    const scrolled = window.pageYOffset;
    const speed = 0.5;
    hero.style.transform = `translateY(${scrolled * speed}px)`;
  });
}

// Classic animations: show all animated elements immediately
function applyClassicAnimations(){
  try{
    document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right, .animate-on-scroll-scale').forEach(el=>{
      el.classList.add('visible');
    });
    // Ensure hero keeps its original transforms without parallax
    const hero = document.querySelector('.hero-image');
    if(hero){ hero.style.transform = ''; }
  }catch{}
}

// Initialize - show landing page on load
document.addEventListener('DOMContentLoaded', () => {
  showLanding();
  // Expose navigation functions for inline onclick in index.html (module scope isn't global)
  window.showSection = showSection;
  window.showLanding = showLanding;
  // Enable tab switching
  setupTabs();
  initSocial();
  initAccount();
  // Reveal CTA animations on hero
  const cta = document.querySelector('.cta-buttons');
  if (cta) cta.classList.add('reveal');
  // Init theme
  initTheme();
  initHC();
  // Dynamic counters
  initMaterialsCount();
  // Init role chooser
  initRoleChooser();
  // Init assistant widget
  initAssistant();
  // Init photo modal
  initPhotoModal();
  // Advanced animations: scroll-trigger + parallax
  initScrollAnimations();
  initParallaxHero();
  initRippleEffect();
  initGlobalKeys();
});

// Tabs navigation (only when in main app)
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-content');
  for (const b of tabs) {
    b.onclick = () => {
      tabs.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
      panels.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-hidden','true'); });
      b.classList.add('active');
      b.setAttribute('aria-selected','true');
      const tabId = b.dataset.tab;
      const tabContent = document.getElementById(tabId);
      if (tabContent) { tabContent.classList.add('active'); tabContent.setAttribute('aria-hidden','false'); }
    };
  }
  // Keyboard navigation for tabs (ArrowLeft/Right, Home/End)
  const tablist = document.querySelector('.tabs');
  if(tablist){
    tablist.addEventListener('keydown', (e)=>{
      const keys = ['ArrowLeft','ArrowRight','Home','End'];
      if(!keys.includes(e.key)) return;
      e.preventDefault();
      const t = Array.from(document.querySelectorAll('.tab'));
      const current = document.activeElement;
      let idx = t.indexOf(current);
      if(e.key==='ArrowRight') idx = (idx+1) % t.length;
      if(e.key==='ArrowLeft') idx = (idx-1+t.length) % t.length;
      if(e.key==='Home') idx = 0;
      if(e.key==='End') idx = t.length-1;
      if(idx>=0){ t[idx].focus(); t[idx].click(); }
    });
  }
}

// Global keyboard: Escape closes modals/panels
function initGlobalKeys(){
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      const modal = document.getElementById('photo-modal');
      if(modal && modal.style.display==='block'){ modal.style.display='none'; disableFocusTrap(); return; }
      const as = document.getElementById('assistant-panel');
      if(as && as.style.display!=='none'){ as.style.display='none'; disableFocusTrap(); return; }
    }
  });
}

// Session & Auth (Account tab)
function getSession(){ try{ return JSON.parse(localStorage.getItem('fixpert_session')||'null'); }catch{ return null; } }
function setSession(s){ localStorage.setItem('fixpert_session', JSON.stringify(s)); renderAccountStatus(); }
function clearSession(){ localStorage.removeItem('fixpert_session'); renderAccountStatus(); }

function renderAccountStatus(){
  const box = document.getElementById('account-status');
  if(!box) return;
  const s = getSession();
  if(s && s.user){
    box.innerHTML = `<div><strong>Accesso effettuato</strong><div>Utente: ${esc(s.user.email)} (${esc(s.user.role)})</div></div>`;
  } else {
    box.innerHTML = `<em>Nessun utente autenticato</em>`;
  }
}

function formToObject(formSel){ const f=new FormData(document.querySelector(formSel)); const o={}; for(const [k,v] of f)o[k]=v; return o; }

function initAccount(){
  renderAccountStatus();
  const fr = document.getElementById('form-register');
  const fl = document.getElementById('form-login');
  const lo = document.getElementById('btn-logout');
  if(fr){ fr.onsubmit = async (e)=>{
    e.preventDefault();
    try{
      const payload = formToObject('#form-register');
      const r = await fetch(API+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
      if(r.error) throw new Error(r.error);
      setSession({ user: r.user });
      toast('Registrazione completata');
    }catch(err){ toast(err.message||'Errore registrazione','error'); }
  }; }
  if(fl){ fl.onsubmit = async (e)=>{
    e.preventDefault();
    try{
      const payload = formToObject('#form-login');
      const r = await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
      if(r.error) throw new Error(r.error);
      setSession({ user: r.user });
      toast('Accesso effettuato');
    }catch(err){ toast(err.message||'Errore login','error'); }
  }; }
  if(lo){ lo.onclick = ()=>{ clearSession(); toast('Sei uscito'); }; }
}

// Aziende: profilo aziendale
function parseCSVList(v) {
  return String(v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function renderCompanyStatus(c) {
  const box = document.getElementById('company-status');
  if (!box) return;
  if (!c) {
    box.innerHTML = '<em>Nessun profilo aziendale trovato. Compila e salva il modulo qui sotto.</em>';
    return;
  }
  const services = c.services ? JSON.parse(c.services) : [];
  const links = c.links ? JSON.parse(c.links) : [];
  const photos = c.photos ? JSON.parse(c.photos) : [];
  const certs = c.certifications ? JSON.parse(c.certifications) : [];
  const logo = photos && photos.length ? photos[0] : null;
  const gallery = photos && photos.length>1 ? photos.slice(1,7) : [];
  const badges = services.length ? `<div class="badges">${services.map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</div>` : '';
  const certBadges = certs.length ? `<div class="badges" style="margin-top:8px">${certs.map(s=>`<span class="badge badge--accent">${esc(s)}</span>`).join('')}</div>` : '';
  function socialIcon(u){
    const x = String(u||'').toLowerCase();
    if(x.includes('instagram')) return '📸';
    if(x.includes('facebook')) return '📘';
    if(x.includes('linkedin')) return '🔗';
    if(x.includes('tiktok')) return '🎵';
    if(x.includes('youtube')) return '▶️';
    if(x.startsWith('http')) return '🌐';
    return '🔗';
  }
  const linksHtml = links.length ? `<div class="social">${links.map(l=>`<a href="${esc(l)}" target="_blank">${socialIcon(l)} <span>${esc(l.replace(/^https?:\/\//,''))}</span></a>`).join('')}</div>` : '—';
  const galleryHtml = gallery.length ? `<div class="cards" style="margin-top:10px">${gallery.map(u=>`<div class="card" style="padding:10px"><img src="${esc(u)}" alt="foto" class="zoomable" data-zoom-src="${esc(u)}" style="width:100%;height:140px;object-fit:cover;border-radius:8px"/></div>`).join('')}</div>` : '';
  const contactsHtml = (c.email||c.phone) ? `<div class="row" style="margin-top:10px;gap:10px"><div>
      ${c.email?`📧 <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:''}
      ${c.phone?` · 📞 <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:''}
    </div>
    <div class="actions"><a class="btn-secondary" href="mailto:${esc(c.email||'')}?subject=Richiesta%20preventivo%20da%20Fixpert" ${c.email?'':'aria-disabled="true"'}>Contatta</a></div></div>` : '';
  box.innerHTML = `
    <div class="row"><div style="display:flex;align-items:center;gap:12px">
      ${logo?`<img src="${esc(logo)}" alt="logo" style="width:56px;height:56px;border-radius:12px;object-fit:cover;border:1px solid #e5e7eb"/>`:''}
      <div><strong>${esc(c.name)}</strong> ${certs.length?`<span class="badge badge--verified" title="Azienda verificata">✔ Verificata</span>`:''}<div>📍 ${esc(c.location || '—')}</div></div>
    </div><div>⭐ ${c.rating_avg != null ? Number(c.rating_avg).toFixed(1) : '—'}</div></div>
    ${badges}
    ${certBadges}
    <div style="margin-top:8px;color:#4a5568">${esc(c.description || '')}</div>
    <div style="margin-top:8px">${links.length?'🌐 Link':''} ${linksHtml}</div>
    ${contactsHtml}
    ${galleryHtml}
  `;
  // Wire zoom clicks
  box.querySelectorAll('img.zoomable').forEach(img=>{
    img.addEventListener('click', ()=> showPhoto(img.getAttribute('data-zoom-src')));
  });
}

async function loadMyCompany() {
  const sess = getSession();
  if (!sess || !sess.user) {
    renderCompanyStatus(null);
    return null;
  }
  const all = await fetch(API + '/api/companies').then(r => r.json()).catch(() => ({ companies: [] }));
  const mine = (all.companies || []).find(c => String(c.user_id) === String(sess.user.id));
  renderCompanyStatus(mine || null);
  return mine || null;
}

function formCompanyToPayload() {
  const f = document.getElementById('form-company');
  const data = new FormData(f);
  const payload = {};
  for (const [k, v] of data) payload[k] = v;
  payload.services = parseCSVList(payload.services);
  payload.links = parseCSVList(payload.links);
  payload.photos = parseCSVList(payload.photos);
  if (payload.logoUrl) {
    // Prepend logo to photos if not present
    const hasLogo = payload.photos.includes(payload.logoUrl);
    payload.photos = hasLogo ? payload.photos : [payload.logoUrl, ...payload.photos];
  }
  payload.certifications = parseCSVList(payload.certifications);
  if (payload.note) {
    payload.description = [payload.description||'', payload.note].filter(Boolean).join('\n');
  }
  return payload;
}

function fillCompanyForm(c) {
  if (!c) return;
  const f = document.getElementById('form-company');
  if (!f) return;
  f.name.value = c.name || '';
  f.location.value = c.location || '';
  try {
    const services = c.services ? JSON.parse(c.services) : [];
    const links = c.links ? JSON.parse(c.links) : [];
    const photos = c.photos ? JSON.parse(c.photos) : [];
    const certs = c.certifications ? JSON.parse(c.certifications) : [];
    f.services.value = services.join(', ');
    f.links.value = links.join(', ');
    f.photos && (f.photos.value = photos.join(', '));
    if (f.logoUrl) { f.logoUrl.value = photos && photos.length ? photos[0] : ''; }
    f.certifications && (f.certifications.value = certs.join(', '));
  } catch {}
  f.description.value = c.description || '';
  if (f.note) f.note.value = '';
}

function initCompanyProfile() {
  const btnLoad = document.getElementById('btn-load-company');
  const form = document.getElementById('form-company');

  if (btnLoad) {
    btnLoad.onclick = async () => {
      try {
        const mine = await loadMyCompany();
        if (mine) fillCompanyForm(mine);
        toast('Profilo caricato');
      } catch {
        toast('Errore nel caricamento profilo', 'error');
      }
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const sess = getSession();
        if (!sess || !sess.user) { toast('Devi essere autenticato per salvare il profilo', 'error'); return; }
        const existing = await loadMyCompany();
        const payload = formCompanyToPayload();
        payload.userId = sess.user.id;
        let res;
        if (existing && existing.id) {
          res = await fetch(API + '/api/companies/' + existing.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
        } else {
          res = await fetch(API + '/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
        }
        if (res.error) throw new Error(res.error);
        await loadMyCompany();
        if (res.company) fillCompanyForm(res.company);
        toast('Profilo salvato');
      } catch (err) {
        toast(err.message || 'Errore salvataggio profilo', 'error');
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCompanyProfile();
});

// Diagnostics
$('#btn-diagnosi').onclick = async () => {
  try{
    const payload = formData('#form-estimate');
    $('#diagnosi-out').innerHTML = loadingHTML('Caricamento checklist...');
    const r = await fetch(API+'/api/diagnostics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    $('#diagnosi-out').innerHTML = r.checklist? `<h3>Checklist</h3><ul class="list">${r.checklist.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : '<em>Nessun suggerimento</em>';
  }catch(e){ toast('Errore nel caricamento della checklist','error'); }
};

// Estimate
$('#form-estimate').onsubmit = async (e) => {
  e.preventDefault();
  try{
    const payload = formData('#form-estimate');
    $('#stima-out').innerHTML = loadingHTML('Calcolo stima...');
    const r = await fetch(API+'/api/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(r.error){ throw new Error(r.error); }
    $('#stima-out').innerHTML = renderEstimate(r);
    toast('Stima generata');
  }catch(err){ $('#stima-out').innerHTML=''; toast(err.message||'Errore nel calcolo della stima','error'); }
};

// Company: requests
$('#btn-load-requests').onclick = async () => {
  try{
    $('#requests-list').innerHTML = skeletonCards(4);
    const r = await fetch(API+'/api/requests').then(r=>r.json());
    $('#requests-list').innerHTML = (r.requests||[]).map(renderReqCard).join('') || '<em>Nessuna richiesta</em>';
  }catch(e){ $('#requests-list').innerHTML=''; toast('Errore nel caricamento richieste','error'); }
};

document.body.addEventListener('click', async (ev) => {
  const q = ev.target.closest('.btn-quote');
  if (q) {
    const id = q.dataset.id;
    const price = Number(prompt('Prezzo totale (€):','100')||'');
    if (!price) return;
    try{
      const res = await fetch(API+'/api/quotes/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({total:price})}).then(r=>r.json());
      if(res.error){ throw new Error(res.error); }
      toast('Preventivo inviato');
    }catch(e){ toast('Errore invio preventivo','error'); }
  }
  const opt = ev.target.closest('.btn-opt');
  if (opt) {
    try{
      const bom = Array.from($('#stima-out tbody')?.children||[]).map(tr=>{
        const [name,qtyu,price,total]=Array.from(tr.children).map(td=>td.textContent.trim());
        const [qty,unit] = qtyu.split(' ');
        return { name, qty:Number(qty), unit, sku: inferSku(name) };
      });
      $('#stima-out').insertAdjacentHTML('beforeend', loadingHTML('Ottimizzazione fornitori...'));
      const r = await fetch(API+'/api/optimize/materials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bom})}).then(r=>r.json());
      const panels = $('#stima-out').querySelectorAll('.loading');
      panels.forEach(p=>p.remove());
      $('#stima-out').insertAdjacentHTML('beforeend', renderOpt(r));
      toast('Ottimizzazione completata');
    }catch(e){ toast('Errore ottimizzazione materiali','error'); }
  }
});

// Deals with category filter
$('#btn-load-deals').onclick = async () => {
  try{
    const category = $('#filter-category').value;
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    $('#deals-list').innerHTML = skeletonCards(6);
    const r = await fetch(API + '/api/deals' + params).then(r => r.json());
    $('#deals-list').innerHTML = renderDeals(r.deals || []);
  }catch(e){ $('#deals-list').innerHTML=''; toast('Errore nel caricamento offerte','error'); }
};

// Social: recensioni e feed
function renderStars(n){
  const x=Math.max(0,Math.min(5,Number(n)||0));
  const full = Math.round(x);
  const star = (filled)=>`<svg viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192L12 .587z"/></svg>`;
  return `<span class="stars">${Array.from({length:5}).map((_,i)=>star(i<full)).join('')}</span>`;
}

function renderBadges(services){
  try{
    const list = Array.isArray(services) ? services : (services ? JSON.parse(services) : []);
    if(!list || !list.length) return '';
    return `<div class="badges">${list.slice(0,4).map(s=>`<span class="badge">${esc(s)}</span>`).join('')}</div>`;
  }catch{ return ''; }
}

function renderLocationPill(loc){
  if(!loc) return '';
  return `<span class="pill">📍 ${esc(loc)}</span>`;
}

async function loadSocialFeed(){
  try{
    $('#social-feed').innerHTML = skeletonCards(6);
    const companies = await fetch(API+'/api/companies').then(r=>r.json());
    const items = await Promise.all((companies.companies||[]).slice(0,10).map(async c=>{
      const reviews = await fetch(API+`/api/companies/${c.id}/reviews`).then(r=>r.json()).catch(()=>({reviews:[]}));
      const rs = (reviews.reviews||[]).slice(0,3).map(rv=>`<li>${renderStars(rv.rating)} <span style="margin-left:6px">${esc(rv.comment||'')}</span></li>`).join('');
      const header = `<div class="row"><div><strong>${esc(c.name)}</strong> • ${renderStars(Number(c.rating_avg||0))}</div><div>${renderLocationPill(c.location)}</div></div>`;
      const badges = renderBadges(c.services);
      const body = rs?`<ul class="list" style="margin-top:8px">${rs}</ul>`:'<em>Nessuna recensione</em>';
      return `<div class="card">${header}${badges}${body}</div>`;
    }));
    $('#social-feed').innerHTML = `<div class="cards">${items.join('')}</div>`;
  }catch(e){ $('#social-feed').innerHTML=''; toast('Errore nel caricamento feed','error'); }
}

const btnLoadSocial = document.getElementById('btn-load-social');
if(btnLoadSocial){ btnLoadSocial.onclick = loadSocialFeed; }

const formReview = document.getElementById('form-review');
if(formReview){ formReview.onsubmit = async (e)=>{
  e.preventDefault();
  try{
    const sess = getSession();
    if(!sess||!sess.user){ toast('Effettua il login per inviare una recensione','error'); return; }
    const f = new FormData(formReview); const payload={}; for(const [k,v] of f) payload[k]=v;
    payload.companyId = Number(payload.companyId);
    payload.userId = sess.user.id;
    payload.rating = Number(payload.rating);
    const r = await fetch(API+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json());
    if(r.error) throw new Error(r.error);
    toast('Recensione inviata');
    // refresh feed
    loadSocialFeed();
  }catch(err){ toast(err.message||'Errore invio recensione','error'); }
}; }

function formData(sel){ const f=new FormData($(sel)); const o={}; for(const [k,v] of f)o[k]=v; o.areaM2=Number(o.areaM2||0); o.rooms=Number(o.rooms||0); return o; }

function renderEstimate(r){ if(!r||!r.estimate) return '<em>Nessuna stima</em>'; const e=r.estimate; const rows=e.bom.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty} ${esc(i.unit)}</td><td>€ ${i.unitPrice}</td><td>€ ${i.lineTotal}</td></tr>`).join(''); return `
  <h3>Richiesta #${r.requestId}</h3>
  <div class="grid two">
    <div>
      <h4>Materiali</h4>
      <table class="table"><thead><tr><th>Prodotto</th><th>Qtà</th><th>Prezzo</th><th>Totale</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div>
      <h4>Riepilogo</h4>
      <ul class="meta">
        <li>Materiali: <strong>€ ${e.costs.materials}</strong></li>
        <li>Manodopera: <strong>€ ${e.costs.labor}</strong></li>
        <li>Overhead: <strong>€ ${e.costs.overhead}</strong></li>
        <li>Totale: <strong>€ ${e.costs.total}</strong></li>
        <li>Tempo: <strong>${e.time.hours} h (~${e.time.days} gg)</strong></li>
      </ul>
      <button class="btn-opt">Ottimizza fornitori</button>
    </div>
  </div>
  ${e.suggestions?.length?`<h4>Suggerimenti</h4><ul class="list">${e.suggestions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}
`; }

function renderOpt(o){ if(!o||!o.bundles) return ''; return `<div class="panel"><h3>Ottimizzazione</h3><div class="cards">${o.bundles.map(b=>`<div class="card"><h4>${esc(b.vendor)}</h4><ul class="meta">${b.items.map(i=>`<li>${esc(i.name)}: € ${i.chosen.price} x ${i.qty}</li>`).join('')}</ul><p><strong>Totale: € ${b.cost}</strong></p></div>`).join('')}</div><p><em>Totale complessivo: € ${o.total}</em></p></div>`; }

function renderReqCard(r){ return `<div class="card"><div class="row"><div><strong>#${esc(r.id.slice(0,8))}</strong><div>${esc(r.payload.jobType)} • ${r.payload.areaM2} m² • ${r.payload.rooms} stanze</div></div><div><button class="btn-quote" data-id="${r.id}">Invia preventivo</button></div></div></div>`; }

function renderDeals(deals) {
  if (!deals.length) return '<em>📦 Nessuna offerta disponibile</em>';
  return `
    <div class="cards">${deals.map(d => `
      <div class="card">
        <div><strong>${esc(d.name)}</strong></div>
        <div>📂 Categoria: ${esc(d.category)}</div>
        <div>🏪 Venditore: ${esc(d.vendor)}</div>
        <div>💰 Prezzo: <strong>€ ${d.price}</strong> / ${esc(d.unit)}</div>
        <div>🏷️ SKU: ${esc(d.sku)}</div>
      </div>
    `).join('')}</div>
  `;
}
