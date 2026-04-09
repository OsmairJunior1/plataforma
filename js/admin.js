// =====================================================
//  SKILLFLIX ADMIN — MAIN SCRIPT
// =====================================================

/* ---- STATE (carregado do localStorage ou dos dados padrão) ---- */
let adminState = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem('eduflix_admin');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return {
    platform: {
      name: 'VGR Academy',
      tagline: 'Sua Plataforma de Cursos',
      primaryColor: '#e50914',
      logoText: 'VGR',
      logoSpan: 'ACADEMY',
    },
    hero: {
      type: 'video', // 'video' | 'image'
      url: 'Hoje nossa reuni%C3%A3o no BNI foi marcada por conex%C3%B5es poderosas e muita gera%C3%A7%C3%A3o de neg%C3%B3cios.Tivemos.mp4',
      poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80',
      badge: 'Em Destaque',
      titleLine1: 'Networking',
      titleLine2: 'Intencional',
      titleHighlight: true,
      description: 'Aprenda as estratégias mais poderosas do networking que abre portas.',
      featuredCourseId: 1,
    },
    featured: [1, 3, 7, 11],
    courses: JSON.parse(JSON.stringify(COURSES)),
    trails: [
      { id: 1, name: 'Marketing Completo', color: '#e50914', courses: [1, 2, 3, 5] },
      { id: 2, name: 'Negócios do Zero', color: '#f5a623', courses: [4, 7, 9] },
      { id: 3, name: 'Tech & Automação', color: '#00d4aa', courses: [8] },
    ],
    activity: []
  };
}

async function saveState() {
  // 1. Cache local (fallback offline)
  try { localStorage.setItem('eduflix_admin', JSON.stringify(adminState)); } catch(e) {}

  // 2. Persistir settings no Supabase
  const cfg = SupabaseDB.stateToSettings(adminState);
  const ok  = await SupabaseDB.saveSettings(cfg);

  logActivity('Configurações salvas', 'fa-save', '#00c853');
  showToast(ok ? 'Salvo no banco! Todos os usuários verão as mudanças.' : 'Salvo localmente (verifique a conexão).', ok ? 'success' : 'info');
}

/** Carrega estado do Supabase e atualiza todos os painéis. */
async function loadStateFromSupabase() {
  const row = await SupabaseDB.getSettings();
  if (!row) return;

  const remote = SupabaseDB.settingsToState(row);
  adminState.platform = { ...adminState.platform, ...remote.platform };
  adminState.hero     = { ...adminState.hero,     ...remote.hero     };
  adminState.landing  = { ...adminState.landing,  ...remote.landing  };
  if (remote.featured?.length) adminState.featured = remote.featured;

  // Cursos do Supabase
  const courses = await SupabaseDB.getCourses({ activeOnly: false });
  if (courses?.length) {
    adminState.courses = courses.map(c => SupabaseDB.courseToLocal(c));
    // Rebuild featured list from featured flag
    const featuredFromDB = courses.filter(c => c.featured).map(c => c.id);
    if (featuredFromDB.length) adminState.featured = featuredFromDB;
  }

  // Re-renderiza todos os painéis com dados frescos
  initDashboard();
  initLandingPanel();
  initHeroPanel();
  initCoursesPanel();
  initFeaturedPanel();
  initTrailsPanel();
  initSettingsPanel();

  showToast('Dados carregados do banco!', 'info');
}

window.loadStateFromSupabase = loadStateFromSupabase;

/* ---- NAVIGATION ---- */
function switchPanel(targetId) {
  document.querySelectorAll('.nav-item[data-panel]').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));

  const navItem = document.querySelector(`.nav-item[data-panel="${targetId}"]`);
  const panel   = document.getElementById(targetId);

  if (navItem) navItem.classList.add('active');
  if (panel)   panel.classList.add('active');

  const titleEl = document.getElementById('panelTitle');
  if (titleEl && navItem) titleEl.textContent = navItem.querySelector('span')?.textContent || '';

  document.getElementById('adminSidebar')?.classList.remove('open');
}

// Event delegation na sidebar — captura cliques em ícone, texto ou item inteiro
document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
  const navItem = e.target.closest('.nav-item[data-panel]');
  if (!navItem) return;
  switchPanel(navItem.dataset.panel);
});

// Hamburger
document.getElementById('hamburgerAdmin')?.addEventListener('click', () => {
  document.getElementById('adminSidebar')?.classList.toggle('open');
});

/* ---- INIT ALL PANELS ---- */
initDashboard();
initLandingPanel();
initHeroPanel();
initCoursesPanel();
initFeaturedPanel();
initTrailsPanel();
initSettingsPanel();

// Se a auth já foi confirmada pelo gate ANTES deste script carregar, carrega agora.
// Se a auth ainda não resolveu, o gate vai chamar loadStateFromSupabase() quando resolver.
if (window.__adminAuthDone) loadStateFromSupabase();

// =====================================================
//  DASHBOARD
// =====================================================
function initDashboard() {
  document.getElementById('statCursos').textContent = adminState.courses.length;
  document.getElementById('statEmDestaque').textContent = adminState.featured.length;
  document.getElementById('statTrilhas').textContent = adminState.trails.length;
  document.getElementById('statAulas').textContent = adminState.courses.reduce((a, c) => a + (c.lessons || 0), 0);
  renderActivity();
}

function renderActivity() {
  const list = document.getElementById('activityLog');
  if (!list) return;
  const acts = adminState.activity.slice(-6).reverse();
  if (!acts.length) { list.innerHTML = '<p style="color:var(--gray2);font-size:0.82rem;padding:8px 0">Nenhuma atividade ainda.</p>'; return; }
  // escapeHtml() em todos os dados dinâmicos para prevenir XSS
  list.innerHTML = acts.map(a => `
    <div class="activity-item">
      <div class="activity-icon" style="background:color-mix(in srgb, ${escapeHtml(a.color)} 15%, transparent); color:${escapeHtml(a.color)}">
        <i class="fas ${escapeHtml(a.icon)}"></i>
      </div>
      <div class="activity-info">
        <p>${escapeHtml(a.msg)}</p>
        <small>${escapeHtml(a.time)}</small>
      </div>
    </div>
  `).join('');
}

function logActivity(msg, icon = 'fa-circle', color = 'var(--blue)') {
  adminState.activity.push({ msg, icon, color, time: new Date().toLocaleString('pt-BR') });
  renderActivity();
}

// =====================================================
//  LANDING PAGE PANEL
// =====================================================
function initLandingPanel() {
  const p = DB.getPlatform();
  setVal('landingMediaType', p.landingVideoType || 'video');
  setVal('landingMediaUrl',  p.landingVideoUrl  || '');
  setVal('landingPosterUrl', p.landingVideoPoster || '');

  toggleLandingFields();
  updateLandingPreview();

  document.getElementById('landingMediaType')?.addEventListener('change', () => {
    toggleLandingFields();
    updateLandingPreview();
  });
  document.getElementById('landingMediaUrl')?.addEventListener('change', updateLandingPreview);
  document.getElementById('landingPosterUrl')?.addEventListener('change', updateLandingPreview);

  document.getElementById('landingFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVal('landingMediaUrl', url);
    updateLandingPreview();
    showToast(`Arquivo carregado: ${file.name}`, 'info');
  });

  document.getElementById('btnSaveLanding')?.addEventListener('click', () => {
    const type   = getVal('landingMediaType');
    const url    = getVal('landingMediaUrl');
    const poster = getVal('landingPosterUrl');
    DB.savePlatform({ landingVideoType: type, landingVideoUrl: url, landingVideoPoster: poster });
    updateLandingPreview();
    logActivity('Vídeo da landing atualizado', 'fa-globe', '#00d4aa');
    showToast('Landing salva com sucesso!', 'success');
  });
}

function toggleLandingFields() {
  const type = getVal('landingMediaType');
  const pg = document.getElementById('landingPosterGroup');
  if (pg) pg.style.display = type === 'video' ? '' : 'none';
}

function updateLandingPreview() {
  const type   = getVal('landingMediaType');
  const url    = getVal('landingMediaUrl');
  const poster = getVal('landingPosterUrl');
  const video  = document.getElementById('landingPreviewVideo');
  const img    = document.getElementById('landingPreviewImg');
  const badge  = document.getElementById('landingVideoBadge');

  if (type === 'video') {
    if (video) {
      video.style.display = '';
      video.poster = poster || '';
      if (url && video.getAttribute('data-src') !== url) {
        video.setAttribute('data-src', url);
        video.src = url;
        video.load();
      }
    }
    if (img) img.style.display = 'none';
    if (badge) badge.style.display = 'flex';
  } else {
    if (video) { video.style.display = 'none'; video.src = ''; }
    if (img) { img.style.display = ''; img.src = url || poster || ''; }
    if (badge) badge.style.display = 'none';
  }
}

// =====================================================
//  HERO PANEL
// =====================================================
function initHeroPanel() {
  const h = adminState.hero;

  // Populate fields
  setVal('heroBadge', h.badge);
  setVal('heroTitleLine1', h.titleLine1);
  setVal('heroTitleLine2', h.titleLine2);
  setVal('heroDesc', h.description);
  setVal('heroMediaType', h.type);
  setVal('heroMediaUrl', h.url);
  setVal('heroPosterUrl', h.poster);
  document.getElementById('heroTitleHighlight').checked = h.titleHighlight;

  // Preview update
  updateHeroPreview();

  // Live preview binding
  ['heroBadge','heroTitleLine1','heroTitleLine2','heroDesc'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateHeroPreview);
  });
  document.getElementById('heroTitleHighlight')?.addEventListener('change', updateHeroPreview);
  document.getElementById('heroMediaType')?.addEventListener('change', () => {
    toggleMediaFields();
    updateHeroPreview();
  });
  document.getElementById('heroMediaUrl')?.addEventListener('change', updateHeroPreview);
  document.getElementById('heroPosterUrl')?.addEventListener('change', updateHeroPreview);

  toggleMediaFields();

  // Save hero
  document.getElementById('btnSaveHero')?.addEventListener('click', () => {
    adminState.hero = {
      ...adminState.hero,
      badge: getVal('heroBadge'),
      titleLine1: getVal('heroTitleLine1'),
      titleLine2: getVal('heroTitleLine2'),
      titleHighlight: document.getElementById('heroTitleHighlight').checked,
      description: getVal('heroDesc'),
      type: getVal('heroMediaType'),
      url: getVal('heroMediaUrl'),
      poster: getVal('heroPosterUrl'),
    };
    saveState();
    updateHeroPreview();
    logActivity('Hero atualizado', 'fa-image', '#e50914');
  });

  // File picker
  document.getElementById('heroFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVal('heroMediaUrl', url);
    updateHeroPreview();
    showToast(`Arquivo carregado: ${file.name}`, 'info');
  });
}

function toggleMediaFields() {
  const type = getVal('heroMediaType');
  const videoFields = document.getElementById('videoPosterGroup');
  if (videoFields) videoFields.style.display = type === 'video' ? '' : 'none';
}

function updateHeroPreview() {
  const badge = getVal('heroBadge');
  const line1 = getVal('heroTitleLine1');
  const line2 = getVal('heroTitleLine2');
  const desc = getVal('heroDesc');
  const highlight = document.getElementById('heroTitleHighlight')?.checked;
  const type = getVal('heroMediaType');
  const url = getVal('heroMediaUrl');
  const poster = getVal('heroPosterUrl');

  const badgeEl = document.getElementById('previewBadge');
  const titleEl = document.getElementById('previewTitle');
  const descEl = document.getElementById('previewDesc');
  const mediaEl = document.getElementById('previewMedia');
  const videoBadge = document.getElementById('previewVideoBadge');

  if (badgeEl) badgeEl.textContent = badge || 'Em Destaque';
  if (titleEl) titleEl.innerHTML = `${line1 || ''}<br><span style="color:${highlight ? 'var(--red)' : 'white'}">${line2 || ''}</span>`;
  if (descEl) descEl.textContent = desc || '';

  if (mediaEl) {
    if (type === 'video') {
      mediaEl.outerHTML = `<video id="previewMedia" class="hero-preview-media" autoplay muted loop playsinline poster="${poster}" src="${url}"></video>`;
      if (videoBadge) videoBadge.style.display = 'flex';
    } else {
      const existingEl = document.getElementById('previewMedia');
      if (existingEl) {
        existingEl.outerHTML = `<img id="previewMedia" class="hero-preview-media" src="${url || poster}" alt="Hero Preview" />`;
      }
      if (videoBadge) videoBadge.style.display = 'none';
    }
  }
}

// =====================================================
//  COURSES PANEL
// =====================================================
function initCoursesPanel() {
  renderCoursesTable();

  document.getElementById('btnAddCourse')?.addEventListener('click', () => openCourseModal(null));
  document.getElementById('btnSaveCourse')?.addEventListener('click', saveCourse);
  document.getElementById('courseSearch')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderCoursesTable(adminState.courses.filter(c => c.title.toLowerCase().includes(q) || c.category.includes(q)));
  });
  document.getElementById('courseFilter')?.addEventListener('change', (e) => {
    const f = e.target.value;
    renderCoursesTable(f === 'all' ? adminState.courses : adminState.courses.filter(c => c.category === f || c.badge === f));
  });

  // Thumbnail preview on URL change
  document.getElementById('courseThumbUrl')?.addEventListener('change', (e) => {
    document.getElementById('courseThumbPreview').src = e.target.value;
  });
  document.getElementById('courseHeroUrl')?.addEventListener('change', (e) => {
    document.getElementById('courseHeroPreview').src = e.target.value;
  });
  document.getElementById('courseThumbFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVal('courseThumbUrl', url);
    document.getElementById('courseThumbPreview').src = url;
  });
}

function renderCoursesTable(courses = adminState.courses) {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  if (!courses.length) { tbody.innerHTML = '<tr><td colspan="7" style="color:var(--gray2);padding:20px;text-align:center">Nenhum curso encontrado.</td></tr>'; return; }
  // IDs numéricos usados em onclick — garantir que são inteiros antes de interpolar
  tbody.innerHTML = courses.map(c => {
    const safeId = parseInt(c.id, 10);
    const isFeatured = adminState.featured.includes(c.id);
    return `
    <tr>
      <td><img src="${escapeHtml(c.thumb)}" alt="${escapeHtml(c.title)}" class="table-thumb" onerror="this.src='https://via.placeholder.com/70x40/1e1e1e/666?text=Sem+Imagem'" /></td>
      <td>
        <div class="table-title">${escapeHtml(c.title)}</div>
        <small style="color:var(--gray2);font-size:0.7rem">${escapeHtml(c.instructor || 'Sem instrutor')}</small>
      </td>
      <td><span style="font-size:0.78rem;color:var(--gray)">${escapeHtml(c.category)}</span></td>
      <td>
        <span class="status-badge ${isFeatured ? 'status-featured' : 'status-active'}">
          ${isFeatured ? '<i class="fas fa-star"></i> Destaque' : '<i class="fas fa-circle"></i> Ativo'}
        </span>
      </td>
      <td style="font-size:0.8rem;color:var(--gray)">${escapeHtml(String(c.lessons || 0))} aulas</td>
      <td><span style="color:#ffd700;font-size:0.8rem">★ ${escapeHtml(String(c.rating))}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-icon-only btn-sm" onclick="openCourseModal(${safeId})" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="btn btn-outline btn-icon-only btn-sm" onclick="toggleFeatured(${safeId})" title="${isFeatured ? 'Remover destaque' : 'Destacar'}">
            <i class="fas fa-star" style="color:${isFeatured ? '#ffd700' : 'inherit'}"></i>
          </button>
          <button class="btn btn-outline btn-icon-only btn-sm" onclick="deleteCourse(${safeId})" title="Excluir" style="color:#e57373"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

let editingCourseId = null;
function openCourseModal(id) {
  editingCourseId = id;
  const course = id ? adminState.courses.find(c => c.id === id) : null;
  const title = id ? 'Editar Curso' : 'Novo Curso';

  document.getElementById('courseModalTitle').textContent = title;
  setVal('courseTitle', course?.title || '');
  setVal('courseCategory', course?.category || 'marketing');
  setVal('courseDuration', course?.duration || '');
  setVal('courseLessons', course?.lessons || '');
  setVal('courseRating', course?.rating || '4.8');
  setVal('courseLevel', course?.level || 'Iniciante');
  setVal('courseBadge', course?.badge || '');
  setVal('coursePlanRequired', course?.planRequired || 'free');
  setVal('courseDesc', course?.desc || '');
  setVal('courseInstructor', course?.instructor || '');
  setVal('courseThumbUrl', course?.thumb || '');
  setVal('courseHeroUrl', course?.hero || '');
  setVal('courseTags', course?.tags?.join(', ') || '');
  document.getElementById('courseThumbPreview').src = course?.thumb || '';
  document.getElementById('courseHeroPreview').src = course?.hero || '';

  openModal('courseModal');
}

async function saveCourse() {
  const title = getVal('courseTitle');
  if (!title.trim()) { showToast('O título é obrigatório!', 'error'); return; }

  const data = {
    title: getVal('courseTitle'),
    category: getVal('courseCategory'),
    duration: getVal('courseDuration'),
    lessons: parseInt(getVal('courseLessons')) || 0,
    rating: parseFloat(getVal('courseRating')) || 4.8,
    level: getVal('courseLevel'),
    badge: getVal('courseBadge'),
    planRequired: getVal('coursePlanRequired') || 'free',
    desc: getVal('courseDesc'),
    instructor: getVal('courseInstructor'),
    thumb: getVal('courseThumbUrl'),
    hero: getVal('courseHeroUrl'),
    tags: getVal('courseTags').split(',').map(t => t.trim()).filter(Boolean),
    progress: 0,
  };

  if (editingCourseId) {
    const existing = adminState.courses.find(c => c.id === editingCourseId);
    const updated  = { ...existing, ...data, id: editingCourseId };
    const saved    = await SupabaseDB.saveCourse(updated);
    if (saved) {
      const idx = adminState.courses.findIndex(c => c.id === editingCourseId);
      if (idx > -1) adminState.courses[idx] = SupabaseDB.courseToLocal(saved);
    } else {
      const idx = adminState.courses.findIndex(c => c.id === editingCourseId);
      if (idx > -1) adminState.courses[idx] = { ...adminState.courses[idx], ...data };
    }
    logActivity(`Curso editado: ${data.title}`, 'fa-pen', '#2196f3');
  } else {
    const saved = await SupabaseDB.saveCourse(data);
    if (saved) {
      adminState.courses.push(SupabaseDB.courseToLocal(saved));
    } else {
      const newId = Math.max(...adminState.courses.map(c => c.id), 0) + 1;
      adminState.courses.push({ id: newId, ...data });
    }
    logActivity(`Curso criado: ${data.title}`, 'fa-plus', '#00c853');
  }

  try { localStorage.setItem('eduflix_admin', JSON.stringify(adminState)); } catch(e) {}
  closeModal('courseModal');
  renderCoursesTable();
  initDashboard();
}

async function deleteCourse(id) {
  if (!confirm('Tem certeza que deseja excluir este curso?')) return;
  const course = adminState.courses.find(c => c.id === id);
  await SupabaseDB.deleteCourse(id);
  adminState.courses  = adminState.courses.filter(c => c.id !== id);
  adminState.featured = adminState.featured.filter(fid => fid !== id);
  try { localStorage.setItem('eduflix_admin', JSON.stringify(adminState)); } catch(e) {}
  renderCoursesTable();
  initDashboard();
  logActivity(`Curso excluído: ${course?.title}`, 'fa-trash', '#e57373');
}

async function toggleFeatured(id) {
  const idx = adminState.featured.indexOf(id);
  if (idx === -1) adminState.featured.push(id);
  else adminState.featured.splice(idx, 1);
  const isFeatured = adminState.featured.includes(id);
  // Atualiza flag featured no curso no Supabase
  const course = adminState.courses.find(c => c.id === id);
  if (course) await SupabaseDB.saveCourse({ ...course, featured: isFeatured });
  // Salva lista de featured nas settings
  await SupabaseDB.saveSettings(SupabaseDB.stateToSettings(adminState));
  try { localStorage.setItem('eduflix_admin', JSON.stringify(adminState)); } catch(e) {}
  renderCoursesTable();
  renderFeaturedList();
  initDashboard();
}

// =====================================================
//  FEATURED PANEL
// =====================================================
function initFeaturedPanel() {
  renderFeaturedList();
  document.getElementById('btnAddFeatured')?.addEventListener('click', openFeaturedSelector);
  document.getElementById('btnSaveFeatured')?.addEventListener('click', () => {
    saveState();
    logActivity('Destaques atualizados', 'fa-star', '#ffd700');
  });
}

function renderFeaturedList() {
  const list = document.getElementById('featuredList');
  if (!list) return;
  const featured = adminState.featured.map(id => adminState.courses.find(c => c.id === id)).filter(Boolean);
  if (!featured.length) { list.innerHTML = '<p style="color:var(--gray2);font-size:0.82rem;padding:16px 0">Nenhum curso em destaque. Clique em "+ Adicionar" para selecionar.</p>'; return; }

  list.innerHTML = featured.map((c, i) => {
    const safeId = parseInt(c.id, 10);
    return `
    <div class="sortable-item" data-id="${safeId}" draggable="true">
      <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
      <img src="${escapeHtml(c.thumb)}" alt="${escapeHtml(c.title)}" onerror="this.src='https://via.placeholder.com/60x34/1e1e1e/666'" />
      <div class="sortable-item-info">
        <strong>${escapeHtml(c.title)}</strong>
        <span>${escapeHtml(c.category)} • ${escapeHtml(String(c.lessons))} aulas</span>
      </div>
      <span style="font-size:0.7rem;background:rgba(255,215,0,0.1);color:#ffd700;padding:2px 8px;border-radius:12px;font-weight:700">#${i+1}</span>
      <button class="btn btn-outline btn-icon-only btn-sm" onclick="toggleFeatured(${safeId})" title="Remover" style="color:#e57373"><i class="fas fa-times"></i></button>
    </div>
  `;
  }).join('');

  initDragSort(list);
}

function openFeaturedSelector() {
  const grid = document.getElementById('featuredSelectorGrid');
  if (!grid) return;
  grid.innerHTML = adminState.courses.map(c => {
    const safeId = parseInt(c.id, 10);
    return `
    <div class="course-selector-item ${adminState.featured.includes(c.id) ? 'selected' : ''}" data-id="${safeId}" onclick="toggleSelectorItem(this, ${safeId})">
      <img src="${escapeHtml(c.thumb)}" alt="${escapeHtml(c.title)}" onerror="this.src='https://via.placeholder.com/140x79/1e1e1e/666'" />
      <span>${escapeHtml(c.title)}</span>
      <div class="check"><i class="fas fa-check"></i></div>
    </div>
  `;
  }).join('');
  openModal('featuredSelectorModal');
}

function toggleSelectorItem(el, id) {
  el.classList.toggle('selected');
  const idx = adminState.featured.indexOf(id);
  if (el.classList.contains('selected') && idx === -1) adminState.featured.push(id);
  else if (!el.classList.contains('selected') && idx > -1) adminState.featured.splice(idx, 1);
}

document.getElementById('btnConfirmFeatured')?.addEventListener('click', () => {
  closeModal('featuredSelectorModal');
  renderFeaturedList();
  saveState();
});

// =====================================================
//  TRAILS PANEL
// =====================================================
function initTrailsPanel() {
  renderTrails();
  document.getElementById('btnAddTrail')?.addEventListener('click', openTrailModal);
  document.getElementById('btnSaveTrail')?.addEventListener('click', saveTrail);
}

function renderTrails() {
  const container = document.getElementById('trailsContainer');
  if (!container) return;
  container.innerHTML = adminState.trails.map(t => {
    const courses = t.courses.map(id => adminState.courses.find(c => c.id === id)).filter(Boolean);
    const safeTrailId = parseInt(t.id, 10);
    return `
      <div class="trail-card" data-trail-id="${safeTrailId}">
        <div class="trail-card-header">
          <span class="trail-color" style="background:${escapeHtml(t.color)}"></span>
          <h4>${escapeHtml(t.name)}</h4>
          <span style="font-size:0.72rem;color:var(--gray2)">${courses.length} curso${courses.length !== 1 ? 's' : ''}</span>
          <div style="display:flex;gap:6px;margin-left:auto">
            <button class="btn btn-outline btn-icon-only btn-sm" onclick="openTrailModal(${safeTrailId})" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn btn-outline btn-icon-only btn-sm" onclick="deleteTrail(${safeTrailId})" title="Excluir" style="color:#e57373"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="trail-card-body">
          ${courses.map(c => {
            const safeCourseId = parseInt(c.id, 10);
            return `
            <div class="trail-course-tag">
              <img src="${escapeHtml(c.thumb)}" style="width:32px;height:18px;object-fit:cover;border-radius:3px" onerror="this.style.display='none'" />
              <span style="font-size:0.78rem">${escapeHtml(c.title)}</span>
              <button style="background:none;border:none;color:var(--gray2);cursor:pointer;font-size:0.7rem" onclick="removeCourseFromTrail(${safeTrailId}, ${safeCourseId})"><i class="fas fa-times"></i></button>
            </div>
          `;
          }).join('')}
          <button class="trail-add-btn" onclick="addCourseToTrail(${safeTrailId})"><i class="fas fa-plus"></i> Adicionar curso</button>
        </div>
      </div>
    `;
  }).join('') + `<button class="btn btn-outline" onclick="openTrailModal()" style="width:100%;justify-content:center;padding:14px;border-style:dashed"><i class="fas fa-plus"></i> Nova Trilha</button>`;
}

let editingTrailId = null;
function openTrailModal(id) {
  editingTrailId = id || null;
  const trail = id ? adminState.trails.find(t => t.id === id) : null;
  document.getElementById('trailModalTitle').textContent = id ? 'Editar Trilha' : 'Nova Trilha';
  setVal('trailName', trail?.name || '');
  setVal('trailColor', trail?.color || '#e50914');
  setVal('trailDesc', trail?.desc || '');

  // Course selector
  const grid = document.getElementById('trailCourseGrid');
  if (grid) {
    const selected = trail?.courses || [];
    grid.innerHTML = adminState.courses.map(c => {
      const safeId = parseInt(c.id, 10);
      return `
      <div class="course-selector-item ${selected.includes(c.id) ? 'selected' : ''}" data-id="${safeId}" onclick="this.classList.toggle('selected')">
        <img src="${escapeHtml(c.thumb)}" alt="${escapeHtml(c.title)}" onerror="this.src='https://via.placeholder.com/140x79/1e1e1e/666'" />
        <span>${escapeHtml(c.title)}</span>
        <div class="check"><i class="fas fa-check"></i></div>
      </div>
    `;
    }).join('');
  }
  openModal('trailModal');
}

function saveTrail() {
  const name = getVal('trailName');
  if (!name.trim()) { showToast('O nome da trilha é obrigatório!', 'error'); return; }
  const selectedCourses = [...document.querySelectorAll('#trailCourseGrid .course-selector-item.selected')].map(el => parseInt(el.dataset.id));

  if (editingTrailId) {
    const idx = adminState.trails.findIndex(t => t.id === editingTrailId);
    if (idx > -1) adminState.trails[idx] = { ...adminState.trails[idx], name, color: getVal('trailColor'), desc: getVal('trailDesc'), courses: selectedCourses };
    logActivity(`Trilha editada: ${name}`, 'fa-route', '#9c27b0');
  } else {
    const newId = Math.max(...adminState.trails.map(t => t.id), 0) + 1;
    adminState.trails.push({ id: newId, name, color: getVal('trailColor'), desc: getVal('trailDesc'), courses: selectedCourses });
    logActivity(`Trilha criada: ${name}`, 'fa-route', '#9c27b0');
  }

  saveState();
  closeModal('trailModal');
  renderTrails();
  initDashboard();
}

function deleteTrail(id) {
  if (!confirm('Excluir esta trilha?')) return;
  const trail = adminState.trails.find(t => t.id === id);
  adminState.trails = adminState.trails.filter(t => t.id !== id);
  saveState();
  renderTrails();
  initDashboard();
  logActivity(`Trilha excluída: ${trail?.name}`, 'fa-trash', '#e57373');
}

function removeCourseFromTrail(trailId, courseId) {
  const trail = adminState.trails.find(t => t.id === trailId);
  if (trail) { trail.courses = trail.courses.filter(id => id !== courseId); saveState(); renderTrails(); }
}

function addCourseToTrail(trailId) { openTrailModal(trailId); }

// =====================================================
//  SETTINGS PANEL
// =====================================================
function initSettingsPanel() {
  const s = adminState.platform;
  setVal('settingName', s.name);
  setVal('settingTagline', s.tagline);
  setVal('settingColor', s.primaryColor);
  setVal('settingLogoText', s.logoText);
  setVal('settingLogoSpan', s.logoSpan);

  document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
    adminState.platform = {
      name: getVal('settingName'),
      tagline: getVal('settingTagline'),
      primaryColor: getVal('settingColor'),
      logoText: getVal('settingLogoText'),
      logoSpan: getVal('settingLogoSpan'),
    };
    saveState();
    logActivity('Configurações da plataforma salvas', 'fa-cog', '#2196f3');
    updateSettingsPreview();
  });

  document.getElementById('settingColor')?.addEventListener('input', updateSettingsPreview);
  document.getElementById('settingLogoText')?.addEventListener('input', updateSettingsPreview);
  document.getElementById('settingLogoSpan')?.addEventListener('input', updateSettingsPreview);
  document.getElementById('settingName')?.addEventListener('input', updateSettingsPreview);

  updateSettingsPreview();

  document.getElementById('btnResetAll')?.addEventListener('click', () => {
    if (!confirm('Isso vai resetar TODAS as configurações para o padrão. Confirmar?')) return;
    localStorage.removeItem('eduflix_admin');
    showToast('Configurações resetadas! Recarregando...', 'info');
    setTimeout(() => location.reload(), 1500);
  });

  document.getElementById('btnExportConfig')?.addEventListener('click', () => {
    const data = JSON.stringify(adminState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eduflix-config.json'; a.click();
    showToast('Configuração exportada!', 'success');
  });

  document.getElementById('btnImportConfig')?.addEventListener('click', () => {
    document.getElementById('importFileInput')?.click();
  });
  document.getElementById('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        adminState = JSON.parse(ev.target.result);
        saveState();
        showToast('Configuração importada com sucesso! Recarregando...', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch { showToast('Arquivo inválido!', 'error'); }
    };
    reader.readAsText(file);
  });
}

function updateSettingsPreview() {
  const color = getVal('settingColor') || '#e50914';
  const logoText = getVal('settingLogoText') || 'SKILL';
  const logoSpan = getVal('settingLogoSpan') || 'FLIX';
  const name = getVal('settingName') || 'SkillFlix';

  const previewLogo = document.getElementById('previewLogo');
  if (previewLogo) previewLogo.innerHTML = `${escapeHtml(logoText)}<span style="color:${escapeHtml(color)}">${escapeHtml(logoSpan)}</span>`;

  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) previewBtn.style.background = color;

  const previewTitle = document.getElementById('previewPlatformName');
  if (previewTitle) previewTitle.textContent = name;
}

// =====================================================
//  UTILITIES
// =====================================================
function getVal(id) { return document.getElementById(id)?.value || ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }

function openModal(id) { document.getElementById(id)?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; }

document.querySelectorAll('.a-modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.closest('.a-modal-overlay')?.id));
});
document.querySelectorAll('.a-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay.id); });
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.a-modal-overlay.open').forEach(m => closeModal(m.id)); });

function showToast(msg, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  // Ícone é um valor interno (não dado do usuário), msg é escapado para prevenir XSS
  const iconEl = document.createElement('i');
  iconEl.className = 'fas ' + (icons[type] || 'fa-circle-check');
  toast.appendChild(iconEl);
  toast.appendChild(document.createTextNode(' ' + msg));
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Drag & drop sort for featured list
function initDragSort(container) {
  let dragged = null;
  container.querySelectorAll('.sortable-item').forEach(item => {
    item.addEventListener('dragstart', () => { dragged = item; setTimeout(() => item.classList.add('dragging'), 0); });
    item.addEventListener('dragend', () => { item.classList.remove('dragging'); dragged = null; updateFeaturedOrder(); });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterEl = getDragAfterElement(container, e.clientY);
      if (!afterEl) container.appendChild(dragged);
      else container.insertBefore(dragged, afterEl);
    });
  });
}
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
  return els.reduce((closest, el) => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: el };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function updateFeaturedOrder() {
  const ids = [...document.querySelectorAll('#featuredList .sortable-item')].map(el => parseInt(el.dataset.id));
  adminState.featured = ids;
}
