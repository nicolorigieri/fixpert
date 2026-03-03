// Inizializzazione gestione upload file
document.addEventListener('DOMContentLoaded', function() {
  initFileUploads();
  initDashboard();
  initPipeline();
});

// Gestione upload file e anteprime
function initFileUploads() {
  const dropZones = {
    photos: {
      drop: document.getElementById('drop-photos'),
      input: document.getElementById('input-photos'),
      preview: document.getElementById('preview-photos'),
      maxFiles: 5,
      accept: 'image/*'
    },
    docs: {
      drop: document.getElementById('drop-docs'),
      input: document.getElementById('input-docs'),
      preview: document.getElementById('preview-docs'),
      maxFiles: 3,
      accept: 'application/pdf,image/*'
    }
  };

  // Inizializza ogni zona di drop
  Object.values(dropZones).forEach(zone => {
    if (!zone.drop || !zone.input) return;

    // Gestione drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      zone.drop.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      zone.drop.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.drop.addEventListener(eventName, unhighlight, false);
    });

    zone.drop.addEventListener('drop', handleDrop.bind(null, zone), false);
    zone.drop.addEventListener('click', () => zone.input.click());
    zone.input.addEventListener('change', (e) => handleFiles(e.target.files, zone));
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight(e) {
    e.currentTarget.classList.add('is-dragover');
  }

  function unhighlight(e) {
    e.currentTarget.classList.remove('is-dragover');
  }

  function handleDrop(zone, e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files, zone);
  }

  async function handleFiles(files, zone) {
    const validFiles = Array.from(files).filter(file => 
      file.type.match(zone.accept.replace('*', '.+'))
    ).slice(0, zone.maxFiles);

    for (const file of validFiles) {
      await createPreview(file, zone);
    }
    updateFileCounters();
  }

  function createPreview(file, zone) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.setAttribute('data-name', file.name);
        
        let previewContent = '';
        if (file.type.startsWith('image/')) {
          previewContent = `
            <img src="${e.target.result}" alt="Anteprima" class="preview-thumb">
            <div class="preview-meta">${truncateFilename(file.name)}</div>
            <div class="preview-size">${formatFileSize(file.size)}</div>
          `;
        } else {
          previewContent = `
            <div class="preview-doc">
              <span>${getFileIcon(file.name)}</span>
            </div>
            <div class="preview-meta">${truncateFilename(file.name)}</div>
            <div class="preview-size">${formatFileSize(file.size)}</div>
          `;
        }
        
        previewItem.innerHTML = previewContent + `
          <button class="preview-remove" aria-label="Rimuovi file">×</button>
        `;
        
        // Aggiungi gestione rimozione
        previewItem.querySelector('.preview-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          previewItem.remove();
          updateFileCounters();
        });
        
        zone.preview.appendChild(previewItem);
        resolve();
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      zip: '🗜️', rar: '🗜️',
      txt: '📄',
      default: '📎'
    };
    return icons[ext] || icons.default;
  }

  function truncateFilename(name, max = 15) {
    if (name.length <= max) return name;
    return name.substring(0, max) + '...';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function updateFileCounters() {
    const photoCount = document.querySelectorAll('#preview-photos .preview-item').length;
    const docCount = document.querySelectorAll('#preview-docs .preview-item').length;
    
    // Aggiorna contatori UI se necessario
    const photoCounter = document.querySelector('#upload-photos-card .hint');
    const docCounter = document.querySelector('#upload-docs-card .hint');
    
    if (photoCounter) {
      photoCounter.textContent = `Max 5 immagini • ${photoCount}/5 caricate`;
    }
    if (docCounter) {
      docCounter.textContent = `Max 3 documenti • ${docCount}/3 caricati`;
    }
  }
}

// Inizializzazione dashboard
function initDashboard() {
  // Carica i dati della dashboard all'apertura della scheda
  const dashboardTab = document.getElementById('tab-dashboard');
  if (dashboardTab) {
    dashboardTab.addEventListener('click', loadDashboardData);
  }
  
  // Simula caricamento dati
  function loadDashboardData() {
    // In una reale applicazione, qui faremmo una chiamata API
    // Per ora simuliamo un caricamento
    updateKPIs({
      requests: '24',
      conversion: '68%',
      response: '2.4h',
      satisfaction: '4.7/5'
    });
    
    // Simula caricamento grafico
    setTimeout(renderCharts, 500);
  }
  
  function updateKPIs(data) {
    const kpiElements = {
      'kpi-requests': data.requests,
      'kpi-conversion': data.conversion,
      'kpi-avg-response': data.response,
      'kpi-satisfaction': data.satisfaction
    };
    
    Object.entries(kpiElements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        const valueEl = el.querySelector('.kpi-value') || el;
        valueEl.textContent = value;
      }
    });
  }
  
  function renderCharts() {
    // In una reale applicazione, useremmo Chart.js o una libreria simile
    const chartEl = document.getElementById('chart-requests');
    if (chartEl) {
      // Simula un grafico
      chartEl.innerHTML = '<div style="padding: 20px; color: #666; text-align: center;">Grafico caricato</div>';
    }
    
    // Simula lista materiali popolari
    const materialsEl = document.getElementById('top-materials');
    if (materialsEl) {
      const materials = [
        { name: 'Piastrelle 30x30', count: 42 },
        { name: 'Pavimento laminato', count: 38 },
        { name: 'Pittura lavabile', count: 29 },
        { name: 'Carta da parati', count: 21 },
        { name: 'Parquet', count: 17 }
      ];
      
      materialsEl.innerHTML = materials.map(m => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
          <span>${m.name}</span>
          <span style="font-weight: bold;">${m.count}</span>
        </div>
      `).join('');
    }
    
    // Simula attività recenti
    const activityEl = document.getElementById('activity-list');
    if (activityEl) {
      const activities = [
        'Nuova richiesta da Mario Rossi',
        'Preventivo accettato da Edilizia S.r.l.',
        'Nuova recensione da Laura Bianchi',
        'Pagamento ricevuto da Paolo Verdi',
        'Lavoro completato per Giardini Felici'
      ];
      
      activityEl.innerHTML = activities.map(a => `<li>${a}</li>`).join('');
    }
  }
}

// Inizializzazione pipeline richieste
function initPipeline() {
  // Carica le richieste all'apertura della scheda aziende
  const aziendeTab = document.getElementById('tab-aziende');
  if (aziendeTab) {
    aziendeTab.addEventListener('click', loadPipeline);
  }
  
  // Simula caricamento richieste
  function loadPipeline() {
    // In una reale applicazione, qui faremmo una chiamata API
    const pipelineData = generateMockPipelineData();
    renderPipeline(pipelineData);
  }
  
  function generateMockPipelineData() {
    return {
      new: [
        { id: 'req-001', title: 'Ristrutturazione bagno', customer: 'Mario Rossi', date: 'Ora', attachments: 2 },
        { id: 'req-002', title: 'Sostituzione infissi', customer: 'Luigi Bianchi', date: '1h fa', attachments: 1 }
      ],
      review: [
        { id: 'req-003', title: 'Rifacimento impianto elettrico', customer: 'Anna Verdi', date: 'Ieri', attachments: 3 }
      ],
      quoted: [
        { id: 'req-004', title: 'Pavimentazione cucina', customer: 'Giovanni Neri', date: '2 giorni fa', attachments: 0 },
        { id: 'req-005', title: 'Tinteggiatura appartamento', customer: 'Sara Gialli', date: '3 giorni fa', attachments: 1 }
      ],
      won: [
        { id: 'req-006', title: 'Ristrutturazione cucina', customer: 'Marco Blu', date: '1 sett. fa', attachments: 4 }
      ],
      lost: [
        { id: 'req-007', title: 'Rifacimento tetto', customer: 'Lucia Rossi', date: '2 sett. fa', attachments: 2 }
      ]
    };
  }
  
  function renderPipeline(data) {
    // Aggiorna i contatori
    Object.entries(data).forEach(([stage, items]) => {
      const badge = document.getElementById(`badge-${stage}`);
      if (badge) {
        badge.textContent = items.length;
      }
      
      // Renderizza le card per ogni fase
      const container = document.getElementById(`stage-${stage}`);
      if (!container) return;
      
      container.innerHTML = items.map(item => createPipelineCard(item, stage)).join('');
      
      // Aggiungi gestione drag and drop
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', (e) => handleDrop(e, stage));
    });
    
    // Mostra/nascondi il messaggio di pipeline vuota
    const totalItems = Object.values(data).reduce((sum, items) => sum + items.length, 0);
    const emptyMsg = document.getElementById('pipeline-empty');
    if (emptyMsg) {
      emptyMsg.hidden = totalItems > 0;
    }
  }
  
  function createPipelineCard(item, stage) {
    return `
      <div class="pipeline-card" draggable="true" data-id="${item.id}">
        <h4>${item.title}</h4>
        <div class="pipeline-meta">
          <span>👤 ${item.customer}</span>
          <span>📅 ${item.date}</span>
        </div>
        ${item.attachments > 0 ? `
          <div class="pipeline-attachments">
            <a href="#" class="attachment-pill" data-action="view-attachments">
              📎 ${item.attachments} ${item.attachments === 1 ? 'allegato' : 'allegati'}
            </a>
          </div>
        ` : ''}
        <div class="pipeline-actions">
          ${stage !== 'won' ? `<button class="btn-secondary" data-action="move-next">${getNextStageLabel(stage)}</button>` : ''}
          <button class="btn-secondary" data-action="view-details">Dettagli</button>
        </div>
      </div>
    `;
  }
  
  function getNextStageLabel(stage) {
    const labels = {
      'new': 'In valutazione',
      'review': 'Invia preventivo',
      'quoted': 'Segna come vinto',
      'won': 'Completato',
      'lost': 'Archivia'
    };
    return labels[stage] || 'Avanti';
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  
  function handleDrop(e, targetStage) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const sourceStage = e.dataTransfer.getData('source-stage');
    
    if (sourceStage === targetStage) return;
    
    // In una reale applicazione, qui faremmo una chiamata API per aggiornare lo stato
    console.log(`Spostato elemento ${itemId} da ${sourceStage} a ${targetStage}`);
    
    // Aggiorna l'UI
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (item) {
      const targetContainer = document.getElementById(`stage-${targetStage}`);
      if (targetContainer) {
        targetContainer.appendChild(item);
        updateBadgeCounters();
      }
    }
  }
  
  function updateBadgeCounters() {
    document.querySelectorAll('.pipeline-column').forEach(column => {
      const stage = column.getAttribute('data-stage');
      const count = column.querySelectorAll('.pipeline-card').length;
      const badge = document.getElementById(`badge-${stage}`);
      if (badge) {
        badge.textContent = count;
      }
    });
  }
  
  // Gestione eventi per le azioni delle card
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.pipeline-card');
    if (!card) return;
    
    const action = e.target.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;
    
    const cardId = card.getAttribute('data-id');
    const stage = card.closest('.pipeline-column')?.getAttribute('data-stage');
    
    switch (action) {
      case 'move-next':
        // Trova il prossimo stato
        const stages = ['new', 'review', 'quoted', 'won'];
        const currentIndex = stages.indexOf(stage);
        if (currentIndex < stages.length - 1) {
          const nextStage = stages[currentIndex + 1];
          const targetContainer = document.getElementById(`stage-${nextStage}`);
          if (targetContainer) {
            targetContainer.appendChild(card);
            updateBadgeCounters();
            toast(`Richiesta spostata in ${getNextStageLabel(stage)}`);
          }
        }
        break;
        
      case 'view-details':
        // In una reale applicazione, mostreremmo i dettagli della richiesta
        toast(`Visualizza dettagli richiesta ${cardId}`);
        break;
        
      case 'view-attachments':
        e.preventDefault();
        // In una reale applicazione, mostreremmo gli allegati
        toast(`Visualizza allegati per ${cardId}`);
        break;
    }
  });
  
  // Abilita il drag and drop per le card
  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.pipeline-card');
    if (!card) return;
    
    const stage = card.closest('.pipeline-column')?.getAttribute('data-stage');
    if (!stage) return;
    
    e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
    e.dataTransfer.setData('source-stage', stage);
    e.dataTransfer.effectAllowed = 'move';
    
    // Aggiungi stile durante il trascinamento
    setTimeout(() => {
      card.classList.add('dragging');
    }, 0);
  });
  
  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.pipeline-card');
    if (card) {
      card.classList.remove('dragging');
    }
  });
}
