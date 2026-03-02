# Fixpert - Piattaforma Intelligente per Lavori Edili

Una piattaforma full-stack moderna che connette clienti e aziende per lavori edili (elettrici, idraulica, climatizzazione, muratura, pittura, pavimenti):

## ✨ Features
- **🎨 UI Moderna**: Design responsive con gradienti, animazioni e layout professionale
- **🗄️ Database SQLite**: Persistenza completa dei dati (richieste, preventivi, fornitori)
- **📋 Diagnostica Automatica**: Checklist personalizzate per ogni tipo di lavoro
- **💰 Stime Intelligenti**: Calcolo automatico BOM, manodopera, tempi e costi con suggerimenti
- **🏢 Gestione Aziende**: Visualizzazione richieste, invio preventivi personalizzati
- **📦 Catalogo Materiali**: Filtro per categoria, ordinamento per prezzo, ottimizzazione fornitori
- **🔄 Tipi di Lavoro Estesi**: 6 categorie (elettrico, idraulico, HVAC, muratura, pittura, pavimenti)

## 🚀 Avvio Rapido
1. **Installa dipendenze:**
```bash
cd server
npm install
```

2. **Avvia il server:**
```bash
npm start
```

3. **Apri nel browser:**
```
http://localhost:3100
```

## 🏗️ Architettura
- **Backend**: Express.js + SQLite (persistenza completa)
- **Frontend**: HTML5/CSS3/JS vanilla (responsive, no build tools)
- **Database**: SQLite con schema per richieste, preventivi, fornitori
- **API**: RESTful endpoints per tutte le operazioni

## 📋 Tipi di Lavoro Supportati
- ⚡ **Elettrico**: Cavi, interruttori, salvavita, scatole
- 🔧 **Idraulico**: Tubi, raccordi, guarnizioni, sifoni
- ❄️ **Climatizzazione**: Condizionatori, staffe, scarichi
- 🧱 **Muratura**: Cemento, sabbia, blocchi, malta
- 🎨 **Pittura**: Primer, pitture, rulli, pennelli
- 🏠 **Pavimenti**: Gres, collanti, stucchi, laminati

## 🔧 API Endpoints
- `POST /api/diagnostics` → Checklist e suggerimenti per sopralluogo
- `POST /api/estimate` → Genera richiesta con stima e BOM
- `GET /api/requests` → Elenco richieste persistite
- `POST /api/quotes/:requestId` → Invia preventivo
- `GET /api/quotes/:requestId` → Lista preventivi per richiesta
- `GET /api/deals?category=X` → Offerte materiali (filtrabili per categoria)
- `POST /api/optimize/materials` → Ottimizzazione fornitori per BOM

## 💾 Persistenza Dati
- ✅ Richieste salvate in database SQLite
- ✅ Preventivi persistenti con relazioni
- ✅ Fornitori e materiali in database
- ✅ Dati mantenuti tra riavvii del server

## 🎯 Miglioramenti Futuri
- 🔐 Autenticazione utenti (clienti/aziende)
- 📧 Notifiche email per nuove richieste
- 📊 Dashboard analytics
- 🌐 API prezzi live da fornitori
- 📱 App mobile companion

## 📝 Note Tecniche
- Node.js 18+ richiesto
- SQLite incluso (no setup database separato)
- Frontend vanilla JS (no React/Vue/Angular)
- Design responsive mobile-first
- API RESTful JSON-based
