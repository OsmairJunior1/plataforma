// =====================================================
//  VGR ACADEMY ADMIN — MAIN SCRIPT
// =====================================================

/* ---- STATE (carregado do localStorage ou dos dados padrão) ---- */
let adminState = loadState();

// Declaradas aqui para evitar Temporal Dead Zone — são usadas em funções
// chamadas sincronamente durante a inicialização (linhas ~195-199)
let editingCourseId = null;
const BUILTIN_SECTION_KEYS = new Set(['featured','continue','popular','new','top10','mylist','categories']);

function loadState() {
  const defaults = {
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
    activity: [],
    homeSections: {
      featured:   { title: 'Em Destaque',            icon: 'fa-star',      visible: true, order: 0 },
      continue:   { title: 'Continuar Assistindo',   icon: 'fa-history',   visible: true, order: 1 },
      popular:    { title: 'Mais Populares',          icon: 'fa-fire',      visible: true, order: 2 },
      new:        { title: 'Lançamentos',             icon: 'fa-sparkles',  visible: true, order: 3 },
      top10:      { title: 'Top 10 da Semana',        icon: 'fa-trophy',    visible: true, order: 4 },
      mylist:     { title: 'Minha Lista',             icon: 'fa-bookmark',  visible: true, order: 5 },
      categories: { title: 'Explorar por Categoria', icon: 'fa-th-large',  visible: true, order: 6 },
    },
  };
  try {
    const saved = localStorage.getItem('vgracademy_admin')
                || localStorage.getItem('eduflix_admin');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migra para a nova chave se veio da antiga
      try { localStorage.setItem('vgracademy_admin', JSON.stringify(parsed)); } catch(e) {}
      // Merge com defaults para garantir que chaves novas (ex: trails, homeSections) existam
      return {
        ...defaults,
        ...parsed,
        platform:     { ...defaults.platform,     ...(parsed.platform     || {}) },
        hero:         { ...defaults.hero,          ...(parsed.hero         || {}) },
        trails:       Array.isArray(parsed.trails)       ? parsed.trails       : defaults.trails,
        featured:     Array.isArray(parsed.featured)     ? parsed.featured     : defaults.featured,
        activity:     Array.isArray(parsed.activity)     ? parsed.activity     : [],
        homeSections: { ...defaults.homeSections,  ...(parsed.homeSections || {}) },
      };
    }
  } catch(e) {}
  return defaults;
}

async function saveState() {
  // 1. Cache local (fallback offline)
  try { localStorage.setItem('vgracademy_admin', JSON.stringify(adminState)); } catch(e) {}

  // 2. Persistir settings no Supabase
  const cfg = SupabaseDB.stateToSettings(adminState);
  const { ok, label } = await SupabaseDB.saveSettings(cfg);

  logActivity('Configurações salvas', 'fa-save', '#00c853');

  // Avisa se seções/trilhas foram descartadas por colunas ausentes
  if (!ok) {
    showToast('Salvo localmente (verifique a conexão com o Supabase).', 'info');
  } else if (label && label !== 'completo') {
    showToast('⚠️ Configurações gerais salvas, mas Seções e Trilhas precisam de migração SQL. Veja o aviso na aba Seções da Home.', 'info');
  } else {
    showToast('Salvo no banco! Todos os usuários verão as mudanças.', 'success');
  }
}

/** Carrega estado do Supabase e atualiza todos os painéis. */
// Detecta se a migração SQL já foi executada no Supabase
function _checkMigration(row) {
  const needsMigration = row.trails === undefined || row.home_sections === undefined;
  const banner = document.getElementById('migrationWarning');
  if (!banner) return;
  if (needsMigration) {
    banner.style.display = '';
  } else {
    banner.style.display = 'none';
  }
}

async function loadStateFromSupabase() {
  const row = await SupabaseDB.getSettings();
  if (!row) return;

  _checkMigration(row);

  const remote = SupabaseDB.settingsToState(row);
  adminState.platform = { ...adminState.platform, ...remote.platform };
  adminState.hero     = { ...adminState.hero,     ...remote.hero     };
  adminState.landing  = { ...adminState.landing,  ...remote.landing  };
  if (remote.featured?.length) adminState.featured = remote.featured;
  if (remote.homeSections) adminState.homeSections = { ...adminState.homeSections, ...remote.homeSections };

  // Sincroniza landing do Supabase → vgracademy_db para que landing.html leia sem precisar de Supabase
  if (remote.landing?.videoUrl) {
    DB.savePlatform({
      landingVideoType:   remote.landing.videoType   || 'video',
      landingVideoUrl:    remote.landing.videoUrl,
      landingVideoPoster: remote.landing.videoPoster || '',
    });
  }

  // Sincroniza hero do Supabase → vgracademy_db para que home.html leia sem precisar de Supabase
  if (remote.hero) {
    DB.savePlatform({
      heroType:           remote.hero.type            || 'video',
      heroUrl:            remote.hero.url             || '',
      heroPoster:         remote.hero.poster          || '',
      heroBadge:          remote.hero.badge           || '',
      heroTitleLine1:     remote.hero.titleLine1      || '',
      heroTitleLine2:     remote.hero.titleLine2      || '',
      heroTitleHighlight: remote.hero.titleHighlight  !== false,
      heroDescription:    remote.hero.description     || '',
    });
  }

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
  initSectionsPanel();
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
initSectionsPanel();
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
  // Prioridade: adminState.landing (vem do Supabase) > DB.getPlatform() (localStorage)
  const landing = adminState.landing || {};
  const p       = DB.getPlatform();
  setVal('landingMediaType', landing.videoType   || p.landingVideoType   || 'video');
  setVal('landingMediaUrl',  landing.videoUrl    || p.landingVideoUrl    || '');
  setVal('landingPosterUrl', landing.videoPoster || p.landingVideoPoster || '');

  toggleLandingFields();
  updateLandingPreview();

  // Guard: adiciona event listeners apenas uma vez
  if (window._landingPanelInit) return;
  window._landingPanelInit = true;

  document.getElementById('landingMediaType')?.addEventListener('change', () => {
    toggleLandingFields();
    updateLandingPreview();
  });
  document.getElementById('landingMediaUrl')?.addEventListener('input', updateLandingPreview);
  document.getElementById('landingPosterUrl')?.addEventListener('input', updateLandingPreview);

  document.getElementById('btnSaveLanding')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveLanding');
    try {
      const type   = getVal('landingMediaType');
      const url    = getVal('landingMediaUrl').trim();
      const poster = getVal('landingPosterUrl').trim();

      if (!url) { showToast('Informe a URL do vídeo ou imagem.', 'error'); return; }

      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

      DB.savePlatform({ landingVideoType: type, landingVideoUrl: url, landingVideoPoster: poster });

      if (!adminState.landing) adminState.landing = {};
      adminState.landing.videoType   = type;
      adminState.landing.videoUrl    = url;
      adminState.landing.videoPoster = poster;

      await saveState();
      updateLandingPreview();
      logActivity('Vídeo da landing atualizado', 'fa-globe', '#00d4aa');
    } catch(e) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar Landing'; }
    }
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

  // Popula dropdown "Curso em Destaque"
  const sel = document.getElementById('heroFeaturedCourseId');
  if (sel) {
    sel.innerHTML = '<option value="">— Selecione um curso —</option>';
    adminState.courses?.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `#${c.id} — ${c.title}`;
      if (String(c.id) === String(h.featuredCourseId)) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  // Preview update
  updateHeroPreview();

  // Guard: registra listeners apenas uma vez
  if (window._heroPanelInit) return;
  window._heroPanelInit = true;

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
  document.getElementById('btnSaveHero')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveHero');
    try {
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

      const featuredId = getVal('heroFeaturedCourseId');
      adminState.hero = {
        ...adminState.hero,
        badge:             getVal('heroBadge'),
        titleLine1:        getVal('heroTitleLine1'),
        titleLine2:        getVal('heroTitleLine2'),
        titleHighlight:    document.getElementById('heroTitleHighlight')?.checked ?? true,
        description:       getVal('heroDesc'),
        type:              getVal('heroMediaType'),
        url:               getVal('heroMediaUrl'),
        poster:            getVal('heroPosterUrl'),
        featuredCourseId:  featuredId ? Number(featuredId) : null,
      };

      DB.savePlatform({
        heroType:           adminState.hero.type          || 'video',
        heroUrl:            adminState.hero.url           || '',
        heroPoster:         adminState.hero.poster        || '',
        heroBadge:          adminState.hero.badge         || '',
        heroTitleLine1:     adminState.hero.titleLine1    || '',
        heroTitleLine2:     adminState.hero.titleLine2    || '',
        heroTitleHighlight: adminState.hero.titleHighlight !== false,
        heroDescription:    adminState.hero.description   || '',
      });

      await saveState();
      updateHeroPreview();
      logActivity('Hero atualizado', 'fa-image', '#e50914');
    } catch(e) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar Hero'; }
    }
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

  const btnAdd = document.getElementById('btnAddCourse');
  if (btnAdd && !btnAdd._bound) { btnAdd._bound = true; btnAdd.addEventListener('click', () => openCourseModal(null)); }
  const btnSave = document.getElementById('btnSaveCourse');
  if (btnSave && !btnSave._bound) { btnSave._bound = true; btnSave.addEventListener('click', saveCourse); }
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

  if (!courses.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--gray2);padding:20px;text-align:center">Nenhum curso encontrado.</td></tr>';
    return;
  }

  // Usa data-id no TR — sem onclick inline, sem risco de quebrar HTML com IDs especiais
  tbody.innerHTML = courses.map(c => {
    const isFeatured = adminState.featured.map(String).includes(String(c.id));
    const secEntry = Object.entries(adminState.homeSections || {})
      .find(([, s]) => (s.courseIds || []).map(String).includes(String(c.id)));
    const secBadge = secEntry
      ? `<br><span style="font-size:0.68rem;color:var(--red);font-weight:600"><i class="fas fa-layer-group"></i> ${escapeHtml(secEntry[1].title || secEntry[0])}</span>`
      : '';
    return `
    <tr data-course-id="${escapeHtml(String(c.id))}">
      <td><img src="${escapeHtml(c.thumb || '')}" alt="${escapeHtml(c.title)}" class="table-thumb"
           onerror="this.src='https://via.placeholder.com/70x40/1e1e1e/666?text=Sem+Imagem'" /></td>
      <td>
        <div class="table-title">${escapeHtml(c.title)}</div>
        <small style="color:var(--gray2);font-size:0.7rem">${escapeHtml(c.instructor || 'Sem instrutor')}</small>
      </td>
      <td>
        <span style="font-size:0.78rem;color:var(--gray)">${escapeHtml(c.category || '')}</span>
        ${secBadge}
      </td>
      <td>
        <span class="status-badge ${isFeatured ? 'status-featured' : 'status-active'}">
          ${isFeatured ? '<i class="fas fa-star"></i> Destaque' : '<i class="fas fa-circle"></i> Ativo'}
        </span>
      </td>
      <td style="font-size:0.8rem;color:var(--gray)">${escapeHtml(String(c.lessons || 0))} aulas</td>
      <td><span style="color:#ffd700;font-size:0.8rem">★ ${escapeHtml(String(c.rating || 0))}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-icon-only btn-sm" data-action="edit"    title="Editar"><i class="fas fa-pen"></i></button>
          <button class="btn btn-outline btn-icon-only btn-sm" data-action="feature" title="${isFeatured ? 'Remover destaque' : 'Destacar'}">
            <i class="fas fa-star" style="color:${isFeatured ? '#ffd700' : 'inherit'}"></i>
          </button>
          <button class="btn btn-outline btn-icon-only btn-sm" data-action="delete"  title="Excluir" style="color:#e57373"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Event delegation — um único listener na tbody, sem onclick inline
  tbody.onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const tr  = btn.closest('tr[data-course-id]');
    if (!tr) return;
    const id  = tr.dataset.courseId;
    const action = btn.dataset.action;
    if (action === 'edit')    openCourseModal(id);
    if (action === 'feature') toggleFeatured(id);
    if (action === 'delete')  deleteCourse(id);
  };
}

function openCourseModal(id) {
  // Normaliza para string para evitar mismatch number vs string de IDs do Supabase
  const sid = id != null ? String(id) : null;
  editingCourseId = sid;
  const course = sid ? adminState.courses.find(c => String(c.id) === sid) : null;
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
  setVal('courseWatchUrl', course?.watchUrl || '');
  setVal('courseDetails', course?.details || '');
  document.getElementById('courseThumbPreview').src = course?.thumb || '';
  document.getElementById('courseHeroPreview').src = course?.hero || '';

  // Popular select de seção com as seções atuais do admin
  const secSelect = document.getElementById('courseSectionKey');
  if (secSelect) {
    // Descobre em qual seção este curso está
    let currentSectionKey = '';
    if (id) {
      for (const [k, s] of Object.entries(adminState.homeSections || {})) {
        if ((s.courseIds || []).map(Number).includes(Number(id))) { currentSectionKey = k; break; }
      }
    }
    const hs = adminState.homeSections || {};
    secSelect.innerHTML = `<option value="">Automático (lógica padrão)</option>`
      + Object.entries(hs)
          .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
          .map(([k, s]) => `<option value="${escapeHtml(k)}" ${k === currentSectionKey ? 'selected' : ''}>${escapeHtml(s.title || k)}</option>`)
          .join('');
  }

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
    watchUrl: getVal('courseWatchUrl').trim(),
    details: getVal('courseDetails').trim(),
    progress: 0,
  };

  // Gerencia atribuição de seção: remove da seção anterior, adiciona na nova
  const newSectionKey = getVal('courseSectionKey');
  const courseId = editingCourseId || null;
  // Remove este curso de todas as seções onde estava
  Object.values(adminState.homeSections || {}).forEach(s => {
    if (s.courseIds) s.courseIds = s.courseIds.filter(i => String(i) !== String(courseId));
  });
  // Adiciona na nova seção (se escolhida) — usa placeholder "__new__" para cursos ainda sem ID real
  if (newSectionKey && adminState.homeSections[newSectionKey]) {
    if (!adminState.homeSections[newSectionKey].courseIds) adminState.homeSections[newSectionKey].courseIds = [];
    const tempId = editingCourseId || '__new__';
    if (!adminState.homeSections[newSectionKey].courseIds.map(String).includes(String(tempId))) {
      adminState.homeSections[newSectionKey].courseIds.push(tempId);
    }
  }

  if (editingCourseId) {
    const existing = adminState.courses.find(c => String(c.id) === String(editingCourseId));
    const updated  = { ...existing, ...data, id: editingCourseId };
    const saved    = await SupabaseDB.saveCourse(updated);
    if (saved) {
      const idx = adminState.courses.findIndex(c => String(c.id) === String(editingCourseId));
      if (idx > -1) adminState.courses[idx] = SupabaseDB.courseToLocal(saved);
    } else {
      const idx = adminState.courses.findIndex(c => String(c.id) === String(editingCourseId));
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

  try { localStorage.setItem('vgracademy_admin', JSON.stringify(adminState)); } catch(e) {}
  closeModal('courseModal');
  renderCoursesTable();
  initDashboard();
  // Se atribuiu uma nova seção, substitui placeholder '__new__' pelo ID real do curso criado
  if (newSectionKey && adminState.homeSections[newSectionKey] && !editingCourseId) {
    const newCourse = adminState.courses[adminState.courses.length - 1];
    if (newCourse) {
      adminState.homeSections[newSectionKey].courseIds = (adminState.homeSections[newSectionKey].courseIds || [])
        .filter(i => String(i) !== '__new__')
        .concat(String(newCourse.id));
    }
  }
}

async function deleteCourse(id) {
  if (!confirm('Tem certeza que deseja excluir este curso?')) return;
  const sid = String(id);
  const course = adminState.courses.find(c => String(c.id) === sid);
  await SupabaseDB.deleteCourse(id);
  adminState.courses  = adminState.courses.filter(c => String(c.id) !== sid);
  adminState.featured = adminState.featured.filter(fid => String(fid) !== sid);
  try { localStorage.setItem('vgracademy_admin', JSON.stringify(adminState)); } catch(e) {}
  renderCoursesTable();
  initDashboard();
  logActivity(`Curso excluído: ${course?.title}`, 'fa-trash', '#e57373');
}

async function toggleFeatured(id) {
  const sid = String(id);
  const idx = adminState.featured.findIndex(fid => String(fid) === sid);
  if (idx === -1) adminState.featured.push(id);
  else adminState.featured.splice(idx, 1);
  const isFeatured = adminState.featured.some(fid => String(fid) === sid);
  // Atualiza flag featured no curso no Supabase
  const course = adminState.courses.find(c => String(c.id) === sid);
  if (course) await SupabaseDB.saveCourse({ ...course, featured: isFeatured });
  // Salva lista de featured nas settings
  await SupabaseDB.saveSettings(SupabaseDB.stateToSettings(adminState)); // retorno ignorado aqui (não é salvar seções)
  try { localStorage.setItem('vgracademy_admin', JSON.stringify(adminState)); } catch(e) {}
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
    localStorage.removeItem('vgracademy_admin');
    showToast('Configurações resetadas! Recarregando...', 'info');
    setTimeout(() => location.reload(), 1500);
  });

  document.getElementById('btnExportConfig')?.addEventListener('click', () => {
    const data = JSON.stringify(adminState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vgracademy-config.json'; a.click();
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
  const name = getVal('settingName') || 'VGR Academy';

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

// =====================================================
//  HOME SECTIONS PANEL
// =====================================================

function buildSectionRow(key, sec) {
  const isCustom = !BUILTIN_SECTION_KEYS.has(key);
  const row = document.createElement('div');
  row.className = 'sortable-item';
  row.dataset.key = key;
  row.draggable = true;
  row.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);cursor:grab;transition:background 0.2s';
  row.innerHTML = `
    <i class="fas fa-grip-vertical" style="color:var(--gray2);font-size:0.75rem;flex-shrink:0"></i>
    <i class="fas ${escapeHtml(sec.icon || 'fa-layer-group')}" style="color:var(--red);width:16px;text-align:center;flex-shrink:0"></i>
    <span style="flex:1;font-size:0.88rem;font-weight:600">${escapeHtml(sec.title)}</span>
    ${isCustom ? `<button class="btn-icon-sm section-delete-btn" data-key="${escapeHtml(key)}" title="Excluir" style="background:none;border:none;color:var(--gray2);cursor:pointer;padding:4px 6px;border-radius:4px;transition:color 0.15s" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--gray2)'"><i class="fas fa-trash-alt" style="font-size:0.78rem"></i></button>` : ''}
    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex-shrink:0">
      <input type="checkbox" class="section-toggle" data-key="${escapeHtml(key)}" ${sec.visible ? 'checked' : ''} />
      <span class="toggle-label-text" style="font-size:0.75rem;color:var(--gray2);min-width:42px">${sec.visible ? 'Visível' : 'Oculta'}</span>
    </label>
  `;

  row.querySelector('.section-toggle').addEventListener('change', (e) => {
    if (!adminState.homeSections[key]) return;
    adminState.homeSections[key].visible = e.target.checked;
    e.target.nextElementSibling.textContent = e.target.checked ? 'Visível' : 'Oculta';
  });

  if (isCustom) {
    row.querySelector('.section-delete-btn')?.addEventListener('click', () => {
      if (!confirm(`Excluir a seção "${sec.title}"?`)) return;
      delete adminState.homeSections[key];
      row.remove();
    });
  }

  return row;
}

function initSectionsPanel() {
  const list = document.getElementById('sectionsList');
  if (!list) return;

  const sections = adminState.homeSections || {};
  const sorted = Object.entries(sections).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  list.innerHTML = '';
  sorted.forEach(([key, sec]) => list.appendChild(buildSectionRow(key, sec)));

  // Drag-sort
  let dragged = null;
  list.addEventListener('dragstart', (e) => {
    dragged = e.target.closest('.sortable-item');
    setTimeout(() => dragged?.classList.add('dragging'), 0);
  });
  list.addEventListener('dragend', () => dragged?.classList.remove('dragging'));
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterEl = getDragAfterElement(list, e.clientY);
    if (!dragged) return;
    if (!afterEl) list.appendChild(dragged);
    else list.insertBefore(dragged, afterEl);
  });

  // Salvar — protege contra listener duplicado (initSectionsPanel pode ser chamado mais de uma vez)
  const btnSave = document.getElementById('btnSaveSections');
  if (btnSave && !btnSave._bound) {
    btnSave._bound = true;
    btnSave.addEventListener('click', async () => {
      list.querySelectorAll('.sortable-item').forEach((row, i) => {
        const key = row.dataset.key;
        if (adminState.homeSections[key]) adminState.homeSections[key].order = i;
      });
      await saveState();
    });
  }

  // Nova Seção
  const btnNew = document.getElementById('btnNewSection');
  if (btnNew && !btnNew._bound) {
    btnNew._bound = true;
    btnNew.addEventListener('click', () => openNewSectionModal());
  }
}

function openNewSectionModal() {
  const modal = document.getElementById('newSectionModal');
  if (!modal) return;

  // Limpa campos
  document.getElementById('newSecTitle').value = '';
  document.getElementById('newSecIcon').value = 'fa-layer-group';
  document.getElementById('newSecIconPreview').className = 'fas fa-layer-group';
  document.getElementById('newSecContent').value = 'all_courses';

  // Gera grade de ícones de atalho
  const grid = document.getElementById('newSecIconGrid');
  if (grid && !grid.dataset.built) {
    grid.dataset.built = '1';
    const ICONS = ['fa-star','fa-fire','fa-trophy','fa-bookmark','fa-bolt',
                   'fa-heart','fa-clock','fa-graduation-cap','fa-video','fa-tag',
                   'fa-users','fa-chart-line','fa-thumbs-up','fa-gem','fa-rocket'];
    ICONS.forEach(ic => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = ic;
      btn.style.cssText = 'background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:7px 11px;cursor:pointer;color:var(--gray1);font-size:0.85rem;transition:background 0.15s';
      btn.innerHTML = `<i class="fas ${ic}"></i>`;
      btn.onmouseenter = () => { btn.style.background = 'var(--bg4)'; };
      btn.onmouseleave = () => { btn.style.background = 'var(--bg3)'; };
      btn.onclick = () => {
        document.getElementById('newSecIcon').value = ic;
        document.getElementById('newSecIconPreview').className = `fas ${ic}`;
      };
      grid.appendChild(btn);
    });
  }

  // Enter no campo nome confirma
  const titleInput = document.getElementById('newSecTitle');
  titleInput.onkeydown = (e) => { if (e.key === 'Enter') confirmNewSection(); };

  modal.classList.add('open');
  titleInput.focus();
}

function closeNewSectionModal() {
  document.getElementById('newSectionModal')?.classList.remove('open');
}

function confirmNewSection() {
  const title   = document.getElementById('newSecTitle')?.value.trim();
  const icon    = document.getElementById('newSecIcon')?.value.trim() || 'fa-layer-group';
  const content = document.getElementById('newSecContent')?.value || 'custom';

  if (!title) { showToast('Informe o nome da seção.', 'info'); return; }

  // Gera chave única
  const baseKey = 'custom_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_');
  let key = baseKey;
  let n = 2;
  while (adminState.homeSections[key]) { key = `${baseKey}_${n++}`; }

  const maxOrder = Math.max(-1, ...Object.values(adminState.homeSections).map(s => s.order || 0));

  adminState.homeSections[key] = {
    title,
    icon: icon.startsWith('fa-') ? icon : `fa-${icon}`,
    visible: true,
    order: maxOrder + 1,
    content,   // 'all_courses' | 'new' | 'popular' | 'custom'
    custom: true,
  };

  const list = document.getElementById('sectionsList');
  if (list) list.appendChild(buildSectionRow(key, adminState.homeSections[key]));

  closeNewSectionModal();
  showToast(`Seção "${title}" criada! Clique em Salvar Seções para aplicar.`, 'success');
}
