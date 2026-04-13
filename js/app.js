// =====================================================
//  VGR ACADEMY — APP MAIN SCRIPT
// =====================================================

/* ---- CARREGAR ESTADO DO PAINEL (localStorage) ---- */
const DEFAULT_STATE = {
  platform: { name: 'VGR Academy', tagline: 'Sua Plataforma de Cursos', primaryColor: '#e50914', logoText: 'VGR', logoSpan: 'ACADEMY' },
  hero: {
    type: 'video',
    url: 'Hoje nossa reuni%C3%A3o no BNI foi marcada por conex%C3%B5es poderosas e muita gera%C3%A7%C3%A3o de neg%C3%B3cios.Tivemos.mp4',
    poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80',
    badge: 'Em Destaque',
    titleLine1: 'Aprendendo a fazer',
    titleLine2: 'Networking Intencional',
    titleHighlight: true,
    description: 'Conheça as estratégias mais poderosas utilizadas por Luccas Cavalli, uma das pessoas de maior influência no meio do BNI.',
    featuredCourseId: 1,
  },
  featured: [1, 3, 7, 11],
  courses: null // será preenchido com COURSES do data.js
};

function getAdminState() {
  try {
    const saved = localStorage.getItem('vgracademy_admin')
               || localStorage.getItem('eduflix_admin');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  // Retorna o estado padrão com os cursos do data.js
  return { ...DEFAULT_STATE, courses: COURSES };
}

function applyAdminState(overrideState) {
  const state = overrideState || getAdminState();
  if (!state) return;

  // --- Plataforma: logo e nome ---
  const { platform, featured, courses } = state;
  let hero = state.hero;
  if (platform) {
    // Atualiza logo em todos os elementos com id="siteLogo"
    // Usar escapeHtml() para prevenir XSS via dados do painel
    const safeLogoText = escapeHtml(platform.logoText || 'SKILL');
    const safeLogoSpan = escapeHtml(platform.logoSpan || 'FLIX');
    document.querySelectorAll('#siteLogo, .logo').forEach(el => {
      el.innerHTML = `${safeLogoText}<span>${safeLogoSpan}</span>`;
    });
    // Atualiza login-logo se existir
    const loginLogo = document.querySelector('.login-logo');
    if (loginLogo) loginLogo.innerHTML = `${safeLogoText}<span>${safeLogoSpan}</span>`;
    // Atualiza footer logo
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) footerLogo.innerHTML = `${safeLogoText}<span>${safeLogoSpan}</span>`;
    // Cor principal
    if (platform.primaryColor) {
      document.documentElement.style.setProperty('--red', platform.primaryColor);
    }
    // Título da aba
    document.title = document.title.replace(/VGR Academy/g, platform.name || 'VGR Academy');
  }

  // --- Hero (apenas na index) ---
  // Prioridade: vgracademy_admin (Supabase) > vgracademy_db (cache local)
  if (!hero?.url && !hero?.titleLine1 && typeof DB !== 'undefined') {
    // Só usa cache local como fallback se não houver dados do Supabase
    const p = DB.getPlatform();
    if (p.heroUrl || p.heroBadge || p.heroTitleLine1) {
      hero = {
        ...(hero || {}),
        type:           p.heroType            || hero?.type           || 'video',
        url:            p.heroUrl             || hero?.url            || '',
        poster:         p.heroPoster          || hero?.poster         || '',
        badge:          p.heroBadge           || hero?.badge          || 'Em Destaque',
        titleLine1:     p.heroTitleLine1      || hero?.titleLine1     || '',
        titleLine2:     p.heroTitleLine2      || hero?.titleLine2     || '',
        titleHighlight: p.heroTitleHighlight  !== undefined ? p.heroTitleHighlight : (hero?.titleHighlight !== false),
        description:    p.heroDescription     || hero?.description    || '',
      };
    }
  }
  if (hero && document.getElementById('heroBg')) {
    // Mídia de fundo
    const heroBg = document.getElementById('heroBg');
    const overlay = heroBg.querySelector('.hero-overlay');
    // Remove mídia antiga se existir
    heroBg.querySelectorAll('video, img.hero-video, img.hero-img').forEach(el => el.remove());
    if (hero.type === 'video') {
      const vid = document.createElement('video');
      vid.className = 'hero-video';
      vid.setAttribute('autoplay', '');
      vid.setAttribute('muted', '');
      vid.setAttribute('loop', '');
      vid.setAttribute('playsinline', '');
      vid.setAttribute('webkit-playsinline', '');
      vid.muted = true;
      if (hero.poster) vid.poster = hero.poster;
      vid.src = hero.url || '';
      heroBg.insertBefore(vid, overlay);
      vid.load();
      vid.play().catch(() => {});
    } else {
      const img = document.createElement('img');
      img.className = 'hero-img';
      img.src = hero.url || hero.poster || '';
      img.alt = 'Hero';
      heroBg.insertBefore(img, overlay);
    }

    // Textos
    const badgeEl = document.getElementById('heroBadgeText');
    if (badgeEl) badgeEl.textContent = hero.badge || 'Em Destaque';

    const titleEl = document.getElementById('heroTitleEl');
    if (titleEl) {
      const highlight = hero.titleHighlight !== false;
      titleEl.innerHTML = `${escapeHtml(hero.titleLine1 || '')}<br /><span style="color:${highlight ? 'var(--red)' : 'inherit'}">${escapeHtml(hero.titleLine2 || '')}</span>`;
    }

    const descEl = document.getElementById('heroDescEl');
    if (descEl) descEl.textContent = hero.description || '';

    // Meta do curso em destaque
    const metaEl = document.getElementById('heroMetaEl');
    const featuredCourse = courses?.find(c => c.id === hero.featuredCourseId) || courses?.[0];
    if (metaEl && featuredCourse) {
      metaEl.innerHTML = `
        <span class="rating"><i class="fas fa-star"></i> ${escapeHtml(String(featuredCourse.rating))}</span>
        <span class="separator">•</span>
        <span>${escapeHtml(String(featuredCourse.lessons))} aulas</span>
        <span class="separator">•</span>
        <span>${escapeHtml(featuredCourse.duration)}</span>
        <span class="separator">•</span>
        <span class="badge-level">${escapeHtml(featuredCourse.level)}</span>
      `;
      const watchBtn = document.getElementById('heroWatchBtn');
      if (watchBtn) {
        watchBtn.removeAttribute('href');
        watchBtn.style.cursor = 'pointer';
        watchBtn.onclick = (e) => {
          e.preventDefault();
          if (featuredCourse.watchUrl) openVideoPlayer(featuredCourse);
          else window.location.href = `curso.html?id=${featuredCourse.id}`;
        };
      }
    }
  }

  // --- Usar cursos do painel nos carrosséis ---
  if (courses && courses.length) {
    // Sobrescreve o array COURSES global com os dados do painel
    COURSES.length = 0;
    courses.forEach(c => COURSES.push(c));
  }

  // --- Manter lista de destaques ordenada globalmente ---
  if (featured && featured.length) {
    window.FEATURED_IDS = featured;
  }
}

// 1. Aplica estado local imediatamente (sem delay)
applyAdminState();

// 2. Carrega dados frescos do Supabase em segundo plano
(async function loadFromSupabase() {
  if (!window.SupabaseDB) return;

  const remoteState = { ...getAdminState() };
  let changed = false;

  // --- Settings (hero, landing, plataforma) ---
  try {
    const settingsRow = await SupabaseDB.getSettings();
    if (settingsRow) {
      const s = SupabaseDB.settingsToState(settingsRow);
      remoteState.platform = s.platform;
      remoteState.hero     = s.hero;
      remoteState.landing  = s.landing;
      if (s.featured?.length) remoteState.featured = s.featured;
      if (s.trails?.length)   remoteState.trails   = s.trails;
      changed = true;

      // Sincroniza hero → vgracademy_db para cache offline
      if (s.hero && typeof DB !== 'undefined') {
        DB.savePlatform({
          heroType:           s.hero.type            || 'video',
          heroUrl:            s.hero.url             || '',
          heroPoster:         s.hero.poster          || '',
          heroBadge:          s.hero.badge           || '',
          heroTitleLine1:     s.hero.titleLine1      || '',
          heroTitleLine2:     s.hero.titleLine2      || '',
          heroTitleHighlight: s.hero.titleHighlight  !== false,
          heroDescription:    s.hero.description     || '',
        });
      }

      // Aplica hero/plataforma imediatamente, sem esperar os cursos
      try { localStorage.setItem('vgracademy_admin', JSON.stringify(remoteState)); } catch(e) {}
      applyAdminState(remoteState);

      // Atualização direta e incondicional do hero — garante que
      // os elementos sejam atualizados independente de qualquer
      // condição dentro de applyAdminState().
      try {
        const _esc = typeof escapeHtml === 'function'
          ? escapeHtml
          : (x => String(x == null ? '' : x)
              .replace(/&/g,'&amp;').replace(/</g,'&lt;')
              .replace(/>/g,'&gt;').replace(/"/g,'&quot;'));
        const h = s.hero;

        const _badge = document.getElementById('heroBadgeText');
        if (_badge) _badge.textContent = h.badge || 'Em Destaque';

        const _title = document.getElementById('heroTitleEl');
        if (_title) {
          const hl = h.titleHighlight !== false;
          _title.innerHTML = _esc(h.titleLine1 || '')
            + '<br /><span style="color:'
            + (hl ? 'var(--red)' : 'inherit') + '">'
            + _esc(h.titleLine2 || '') + '</span>';
        }

        const _desc = document.getElementById('heroDescEl');
        if (_desc) _desc.textContent = h.description || '';

        const _bg = document.getElementById('heroBg');
        if (_bg && h.url) {
          _bg.querySelectorAll('video, img.hero-video, img.hero-img').forEach(el => el.remove());
          const _ov = _bg.querySelector('.hero-overlay');
          if (h.type === 'image') {
            const _img = document.createElement('img');
            _img.className = 'hero-img';
            _img.src = h.url;
            _img.alt = 'Hero';
            _bg.insertBefore(_img, _ov || null);
          } else {
            const _vid = document.createElement('video');
            _vid.className = 'hero-video';
            _vid.setAttribute('autoplay', '');
            _vid.setAttribute('muted', '');
            _vid.setAttribute('loop', '');
            _vid.setAttribute('playsinline', '');
            _vid.setAttribute('webkit-playsinline', '');
            _vid.muted = true;
            if (h.poster) _vid.poster = h.poster;
            _vid.src = h.url;
            _bg.insertBefore(_vid, _ov || null);
            _vid.load();
            _vid.play().catch(() => {});
          }
        }
      } catch(_e) {
        // silently ignore DOM update errors
      }
    }
  } catch(e) {
    console.warn('[app] getSettings falhou:', e.message);
  }

  // --- Cursos (independente dos settings) ---
  try {
    const courses = await SupabaseDB.getCourses({ activeOnly: true });
    if (courses?.length) {
      remoteState.courses = courses.map(c => SupabaseDB.courseToLocal(c));
      if (!remoteState.featured?.length) {
        const featFromDB = courses.filter(c => c.featured).map(c => c.id);
        if (featFromDB.length) remoteState.featured = featFromDB;
      }
      changed = true;
      try { localStorage.setItem('vgracademy_admin', JSON.stringify(remoteState)); } catch(e) {}
      applyAdminState(remoteState);
      if (typeof renderCarousels === 'function') renderCarousels();
    }
  } catch(e) {
    console.warn('[app] getCourses falhou:', e.message);
  }
})();

/* ---- NAVBAR SCROLL ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ---- HAMBURGER ---- */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

/* ---- SEARCH ---- */
const searchToggle = document.getElementById('searchToggle');
const searchBar = document.getElementById('searchBar');
const closeSearch = document.getElementById('closeSearch');
const searchInput = document.getElementById('searchInput');

if (searchToggle) {
  searchToggle.addEventListener('click', () => {
    searchBar.classList.add('active');
    searchInput?.focus();
  });
}
if (closeSearch) {
  closeSearch.addEventListener('click', () => {
    searchBar.classList.remove('active');
    if (searchInput) searchInput.value = '';
  });
}
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `catalogo.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });
}

/* ---- CAROUSEL NAVIGATION ---- */
document.querySelectorAll('.carousel-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const carousel = document.getElementById(targetId);
    if (!carousel) return;
    const scrollAmt = carousel.clientWidth * 0.75;
    carousel.scrollBy({ left: btn.classList.contains('prev') ? -scrollAmt : scrollAmt, behavior: 'smooth' });
  });
});

/* ---- CREATE COURSE CARD ---- */
function createCourseCard(course, opts = {}) {
  const { showProgress = false, showTop10 = false, index = 0 } = opts;
  const card = document.createElement('div');

  // Verificar se o curso é premium e o usuário é free
  const userPlan    = window.CURRENT_USER?.plan || 'free';
  const isLocked    = course.planRequired === 'premium' && userPlan === 'free';

  card.className = 'course-card' + (showTop10 ? ' top10-card' : '') + (isLocked ? ' card-locked' : '');
  card.dataset.id = course.id;

  // Whitelist de badges válidos para evitar injeção de classe CSS arbitrária
  const VALID_BADGES = { new: 'Novo', hot: '🔥 Hot', free: 'Grátis', top: '⭐ Top' };
  const badgeHTML = !isLocked && course.badge && VALID_BADGES[course.badge]
    ? `<span class="card-badge badge-${escapeHtml(course.badge)}">${VALID_BADGES[course.badge]}</span>`
    : '';

  // Garantir que progress seja um número entre 0-100
  const safeProgress = Math.min(100, Math.max(0, Number(course.progress) || 0));
  const progressHTML = !isLocked && showProgress && safeProgress > 0
    ? `<div class="card-progress"><div class="card-progress-fill" style="width:${safeProgress}%"></div></div>`
    : '';

  const top10HTML = showTop10
    ? `<span class="top10-number">${index + 1}</span>`
    : '';

  const inList = MY_LIST.includes(course.id);

  // Overlay de cadeado para cursos premium
  const lockHTML = isLocked ? `
    <div class="card-lock-overlay">
      <div class="card-lock-icon"><i class="fas fa-lock"></i></div>
      <span class="card-lock-label">PREMIUM</span>
    </div>` : '';

  // Ações: se bloqueado, não mostra botão de play
  const actionsHTML = isLocked
    ? `<button class="card-btn card-btn-premium" data-action="upgrade" title="Ver planos">
         <i class="fas fa-crown"></i> Assinar Premium
       </button>`
    : `<button class="card-btn play-small" data-action="play" title="Assistir"><i class="fas fa-play"></i></button>
       <button class="card-btn btn-addlist" data-action="list" title="${inList ? 'Remover da lista' : 'Adicionar à lista'}">
         <i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i>
       </button>
       <button class="card-btn" data-action="info" title="Mais info"><i class="fas fa-info"></i></button>
       <span style="margin-left:auto;font-size:0.7rem;color:var(--gray)">${escapeHtml(course.duration)}</span>`;

  // Todos os dados de curso passam por escapeHtml() antes de innerHTML
  card.innerHTML = `
    <div class="card-thumb">
      <img src="${escapeHtml(course.thumb)}" alt="${escapeHtml(course.title)}" loading="lazy" />
      ${isLocked ? '' : '<div class="card-play-btn"><i class="fas fa-play"></i></div>'}
      <div class="card-badges">${badgeHTML}</div>
      ${top10HTML}
      ${progressHTML}
      ${lockHTML}
    </div>
    <div class="card-body">
      <div class="card-title">${escapeHtml(course.title)}</div>
      <div class="card-meta">
        <span class="star"><i class="fas fa-star"></i> ${escapeHtml(String(course.rating))}</span>
        <span>${escapeHtml(String(course.lessons))} aulas</span>
        <span>${escapeHtml(course.level)}</span>
      </div>
    </div>
    <div class="card-expanded">
      <p>${escapeHtml(course.desc)}</p>
      <div class="card-actions">${actionsHTML}</div>
    </div>
  `;

  // Card actions
  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (isLocked) {
      // Curso bloqueado — mostrar mensagem de upgrade
      showToast('🔒 Este curso é exclusivo para assinantes Premium. Em breve disponível!', 'info');
      return;
    }
    if (action === 'play') {
      window.location.href = `curso.html?id=${course.id}`;
    } else if (action === 'list') {
      toggleMyList(course.id, card);
      e.stopPropagation();
    } else if (action === 'info') {
      openModal(course);
      e.stopPropagation();
    } else if (!e.target.closest('button')) {
      openModal(course);
    }
  });

  return card;
}

/* ---- POPULATE CAROUSELS (legacy landscape cards) ---- */
function populateCarousel(id, courses, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  courses.forEach((course, index) => {
    el.appendChild(createCourseCard(course, { ...opts, index }));
  });
}

/* ---- CREATE POSTER CARD (2:3 portrait, cinema style) ---- */
function createPosterCard(course, opts = {}) {
  const { showRank = false, index = 0 } = opts;
  const card = document.createElement('div');
  const userPlan = window.CURRENT_USER?.plan || 'free';
  const isLocked = course.planRequired === 'premium' && userPlan === 'free';
  card.className = 'poster-card' + (isLocked ? ' card-locked' : '');
  card.dataset.id = course.id;

  const VALID_BADGES = { new: 'Novo', hot: '🔥 Hot', free: 'Grátis', top: '⭐ Top' };
  const badgeHTML = !isLocked && course.badge && VALID_BADGES[course.badge]
    ? `<span class="poster-badge badge-${escapeHtml(course.badge)}">${VALID_BADGES[course.badge]}</span>`
    : '';
  const rankHTML = showRank ? `<span class="poster-rank">${index + 1}</span>` : '';
  const lockHTML = isLocked ? `
    <div class="poster-lock">
      <i class="fas fa-lock"></i>
      <span>PREMIUM</span>
    </div>` : '';
  const inList = MY_LIST.includes(course.id);

  card.innerHTML = `
    <div class="poster-thumb">
      <img src="${escapeHtml(course.thumb)}" alt="${escapeHtml(course.title)}" loading="lazy" />
      <div class="poster-gradient"></div>
      <div class="poster-play"><i class="fas fa-play"></i></div>
      <div class="poster-info">
        <div class="poster-title">${escapeHtml(course.title)}</div>
        <div class="poster-meta">
          <span class="p-star"><i class="fas fa-star"></i></span>
          <span>${escapeHtml(String(course.rating))}</span>
          <span class="p-sep">•</span>
          <span>${escapeHtml(String(course.lessons))} aulas</span>
        </div>
      </div>
      ${badgeHTML}
      ${rankHTML}
      ${lockHTML}
      <div class="poster-actions">
        ${isLocked
          ? `<button class="pa-btn pa-btn-play" data-action="upgrade" title="Premium"><i class="fas fa-crown"></i></button>`
          : `<button class="pa-btn pa-btn-play" data-action="play" title="Assistir"><i class="fas fa-play"></i></button>
             <button class="pa-btn" data-action="list" title="${inList ? 'Remover da lista' : 'Adicionar à lista'}"><i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i></button>
             <button class="pa-btn" data-action="info" title="Mais info"><i class="fas fa-info"></i></button>`
        }
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (isLocked) { showToast('🔒 Exclusivo para assinantes Premium.', 'info'); return; }
    if (action === 'play') { if (course.watchUrl) openVideoPlayer(course); else window.location.href = `curso.html?id=${course.id}`; }
    else if (action === 'list') { toggleMyList(course.id, card); e.stopPropagation(); }
    else if (action === 'info') { openModal(course); e.stopPropagation(); }
    else if (!e.target.closest('button')) openModal(course);
  });

  return card;
}

/* ---- POPULATE POSTER CAROUSEL ---- */
function populatePosterCarousel(id, courses, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  courses.forEach((course, index) => el.appendChild(createPosterCard(course, { ...opts, index })));
}

/* ---- RENDER FEATURED GRID ---- */
function renderFeaturedGrid() {
  const grid = document.getElementById('featuredPosterGrid');
  if (!grid) return;

  // 1ª prioridade: IDs ordenados salvos pelo admin (FEATURED_IDS)
  const ids = window.FEATURED_IDS;
  let toShow = [];

  if (ids && ids.length) {
    toShow = ids.map(id => COURSES.find(c => c.id === id || c.id === Number(id))).filter(Boolean);
  }

  // 2ª prioridade: cursos com flag featured = true (vinda do Supabase)
  if (!toShow.length) {
    toShow = COURSES.filter(c => c.featured);
  }

  // Fallback: primeiros 6 cursos
  if (!toShow.length) {
    toShow = COURSES.slice(0, 6);
  }

  grid.innerHTML = '';
  toShow.forEach((course, index) => grid.appendChild(createPosterCard(course, { index })));
}

/* ---- RENDER ALL POSTER CAROUSELS ---- */
function renderCarousels() {
  const courses = COURSES;
  if (!courses.length) return;
  const user = window.CURRENT_USER;
  const userProgress = user?.progress || {};

  // "Continuar Assistindo" — só mostra se o usuário tem progresso real
  const inProgress = courses.filter(c => {
    const p = userProgress[c.id];
    return p && p.percent > 0 && p.percent < 100;
  });
  const continueSection = document.querySelector('.section.poster-carousel-row:has(#continueRow)');
  if (inProgress.length) {
    if (continueSection) continueSection.style.display = '';
    populatePosterCarousel('continueRow', inProgress);
  } else {
    if (continueSection) continueSection.style.display = 'none';
  }

  const popular = [...courses].sort((a, b) => b.rating - a.rating).slice(0, 10);
  populatePosterCarousel('popularRow', popular);

  const newCourses = courses.filter(c => c.badge === 'new' || c.badge === 'hot');
  populatePosterCarousel('newRow', newCourses.length ? newCourses : courses.slice(0, 8));

  const top10 = [...courses].slice(0, 10);
  populatePosterCarousel('top10Row', top10, { showRank: true });

  const mylistCourses = courses.filter(c => MY_LIST.includes(c.id));
  populatePosterCarousel('mylistRow', mylistCourses);
  const mylistSection = document.getElementById('mylistSection');
  if (mylistSection) mylistSection.style.display = mylistCourses.length ? '' : 'none';

  renderFeaturedGrid();
  renderTrailSections();
  renderCategoriesGrid();
}

/* ---- RENDER TRAIL SECTIONS ---- */
function renderTrailSections() {
  const container = document.getElementById('trailsContainer');
  if (!container) return;

  const state = getAdminState();
  const trails = state.trails || [];
  const allCourses = COURSES;

  if (!trails.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = trails.map(trail => {
    const trailCourses = (trail.courses || [])
      .map(id => allCourses.find(c => c.id === id))
      .filter(Boolean);
    if (!trailCourses.length) return '';

    const rowId = `trailRow_${trail.id}`;
    const safeColor = escapeHtml(trail.color || '#e50914');
    const safeName  = escapeHtml(trail.name  || 'Trilha');

    const cards = trailCourses.map((course, i) => {
      const card = createPosterCard(course, { index: i });
      return card.outerHTML;
    }).join('');

    return `
      <section class="section poster-carousel-row trail-section">
        <div class="section-header">
          <h2><span class="trail-dot" style="background:${safeColor};width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:8px"></span>${safeName}</h2>
        </div>
        <div class="carousel-wrap">
          <button class="carousel-btn prev" data-target="${rowId}"><i class="fas fa-chevron-left"></i></button>
          <div class="carousel" id="${rowId}">${cards}</div>
          <button class="carousel-btn next" data-target="${rowId}"><i class="fas fa-chevron-right"></i></button>
        </div>
      </section>
    `;
  }).join('');

  // Rebind carousel buttons para os novos elementos
  container.querySelectorAll('.carousel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const carousel = document.getElementById(targetId);
      if (!carousel) return;
      const scrollAmt = carousel.clientWidth * 0.75;
      carousel.scrollBy({ left: btn.classList.contains('prev') ? -scrollAmt : scrollAmt, behavior: 'smooth' });
    });
  });

  // Rebind card click para trilhas (poster cards)
  container.querySelectorAll('.poster-card').forEach(cardEl => {
    cardEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const course = COURSES.find(c => String(c.id) === cardEl.dataset.id);
        if (!course) return;
        const action = btn.dataset.action;
        if (action === 'play') { if (course.watchUrl) openVideoPlayer(course); else window.location.href = `curso.html?id=${course.id}`; }
        else if (action === 'list') toggleMyList(course.id, cardEl);
        else if (action === 'info') openModal(course);
      });
    });
    cardEl.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const course = COURSES.find(c => String(c.id) === cardEl.dataset.id);
      if (course) openModal(course);
    });
  });
}

/* ---- RENDER CATEGORIES GRID (dynamic from courses) ---- */
function renderCategoriesGrid() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  const CATEGORY_META = {
    marketing:  { label: 'Marketing',  icon: 'fa-bullhorn',   clr: '#e50914' },
    negocios:   { label: 'Negócios',   icon: 'fa-briefcase',  clr: '#f5a623' },
    tecnologia: { label: 'Tecnologia', icon: 'fa-code',       clr: '#00d4aa' },
    design:     { label: 'Design',     icon: 'fa-palette',    clr: '#7c5cbf' },
    financas:   { label: 'Finanças',   icon: 'fa-chart-line', clr: '#ff6b35' },
    vendas:     { label: 'Vendas',     icon: 'fa-handshake',  clr: '#2196f3' },
    geral:      { label: 'Geral',      icon: 'fa-graduation-cap', clr: '#888' },
  };

  // Conta cursos por categoria
  const counts = {};
  COURSES.forEach(c => {
    const cat = c.category || 'geral';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // Só mostra categorias que têm cursos
  const cats = Object.keys(counts).filter(k => counts[k] > 0);
  if (!cats.length) return;

  grid.innerHTML = cats.map(cat => {
    const meta = CATEGORY_META[cat] || { label: cat, icon: 'fa-folder', clr: '#888' };
    const count = counts[cat];
    return `
      <div class="category-card" style="--clr:${escapeHtml(meta.clr)}" data-filter="${escapeHtml(cat)}">
        <i class="fas ${escapeHtml(meta.icon)}"></i>
        <span>${escapeHtml(meta.label)}</span>
        <small>${count} curso${count !== 1 ? 's' : ''}</small>
      </div>`;
  }).join('');

  // Rebind click events
  grid.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `catalogo.html?cat=${card.dataset.filter}`;
    });
  });
}

// Init poster carousels on home page
if (document.getElementById('continueRow')) renderCarousels();

/* ---- CATEGORY CARDS ---- */
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.dataset.filter;
    window.location.href = `catalogo.html?cat=${filter}`;
  });
});

/* ---- MY LIST TOGGLE ---- */
function toggleMyList(courseId, cardEl) {
  const idx = MY_LIST.indexOf(courseId);
  const btn = cardEl?.querySelector('[data-action="list"]');
  if (idx === -1) {
    MY_LIST.push(courseId);
    if (btn) btn.innerHTML = '<i class="fas fa-check"></i>';
    showToast('Adicionado à sua lista!');
  } else {
    MY_LIST.splice(idx, 1);
    if (btn) btn.innerHTML = '<i class="fas fa-plus"></i>';
    showToast('Removido da sua lista.');
  }
}

/* ---- MODAL ---- */
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

function openModal(course) {
  if (!modalOverlay) return;
  document.getElementById('modalImg').src = course.hero || course.thumb;
  document.getElementById('modalTitle').textContent = course.title;
  document.getElementById('modalDesc').textContent = course.desc;
  document.getElementById('modalLessons').textContent = course.lessons;
  document.getElementById('modalDuration').textContent = course.duration;
  document.getElementById('modalRating').textContent = `⭐ ${course.rating}`;
  document.getElementById('modalLevel').textContent = course.level;
  const watchBtn = document.getElementById('modalWatch');
  if (watchBtn) {
    watchBtn.removeAttribute('href');
    watchBtn.onclick = (e) => { e.preventDefault(); closeModal(); openVideoPlayer(course); };
  }

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = course.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('');

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ── YOUTUBE / VIDEO PLAYER ── */
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&#/]+)/,
    /[?&]v=([^?&#/]+)/,
    /youtube\.com\/embed\/([^?&#/]+)/,
    /youtube\.com\/shorts\/([^?&#/]+)/,
  ];
  for (const p of patterns) { const m = String(url).match(p); if (m) return m[1]; }
  return null;
}

function openVideoPlayer(course) {
  const overlay = document.getElementById('vgrPlayerOverlay');
  const wrap    = document.getElementById('vgrPlayerWrap');
  const titleEl = document.getElementById('vgrPlayerTitle');
  if (!overlay || !wrap) { window.location.href = course.watchUrl || `curso.html?id=${course.id}`; return; }

  wrap.innerHTML = '';
  if (titleEl) titleEl.textContent = course.title || '';

  const ytId = extractYouTubeId(course.watchUrl || '');
  if (ytId) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&color=white`;
    iframe.style.cssText = 'width:100%;height:100%;border:none';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.setAttribute('allowfullscreen','');
    wrap.appendChild(iframe);
  } else if (course.watchUrl) {
    const video = document.createElement('video');
    video.src = course.watchUrl; video.controls = true; video.autoplay = true;
    video.style.cssText = 'width:100%;height:100%;background:#000';
    wrap.appendChild(video);
  } else {
    wrap.innerHTML = '<p style="color:rgba(255,255,255,0.4);text-align:center;padding-top:80px;font-size:0.9rem">Vídeo não disponível.</p>';
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
  const overlay = document.getElementById('vgrPlayerOverlay');
  const wrap    = document.getElementById('vgrPlayerWrap');
  if (wrap) wrap.innerHTML = '';
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

// Bind close button + ESC + click outside
(function bindVideoPlayer() {
  const overlay = document.getElementById('vgrPlayerOverlay');
  const closeBtn = document.getElementById('vgrPlayerClose');
  if (closeBtn) closeBtn.addEventListener('click', closeVideoPlayer);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeVideoPlayer(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('vgrPlayerOverlay')?.style.display === 'flex') closeVideoPlayer(); });
})();

/* ---- TOAST ---- */
function showToast(msg, icon = 'fa-circle-check') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ---- PLAYER PAGE TABS ---- */
document.querySelectorAll('.player-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.player-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.player-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById(target)?.classList.add('active');
  });
});

/* ---- CATALOG FILTER ---- */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    filterCatalog(filter);
  });
});

function filterCatalog(filter) {
  const grid = document.getElementById('courseGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const filtered = filter === 'all' ? COURSES : COURSES.filter(c => c.category === filter || c.level.toLowerCase() === filter || c.badge === filter);
  filtered.forEach(c => {
    const card = createCourseCard(c);
    card.style.minWidth = 'unset';
    card.style.maxWidth = 'unset';
    grid.appendChild(card);
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--gray);padding:20px 0">Nenhum curso encontrado.</p>';
  }
}

// Init catalog page
if (document.getElementById('courseGrid')) {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  const q = params.get('q');

  if (q) {
    const results = COURSES.filter(c =>
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
    );
    const grid = document.getElementById('courseGrid');
    if (grid) {
      grid.innerHTML = '';
      results.forEach(c => { const card = createCourseCard(c); card.style.minWidth='unset'; card.style.maxWidth='unset'; grid.appendChild(card); });
      const ph = document.querySelector('.page-header h1');
      if (ph) ph.textContent = `Resultados para "${q}"`;
    }
  } else if (cat) {
    // Activate correct filter button
    const btn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
    if (btn) btn.click();
    else filterCatalog('all');
  } else {
    filterCatalog('all');
  }
}

/* ---- PLAYER PAGE INIT ---- */
if (document.getElementById('lessonList')) {
  const params = new URLSearchParams(window.location.search);
  const courseId = parseInt(params.get('id') || '1');
  const course = COURSES.find(c => c.id === courseId) || COURSES[0];

  // Set titles
  const ct = document.getElementById('courseTitleEl');
  const lt = document.getElementById('lessonTitleEl');
  if (ct) ct.textContent = course.title;
  if (lt) lt.textContent = 'Selecione uma aula para começar';

  // Set video thumb
  const vImg = document.getElementById('videoThumb');
  if (vImg) vImg.src = course.hero || course.thumb;

  // Build lesson list
  const list = document.getElementById('lessonList');
  const lessonData = LESSONS[courseId] || LESSONS[1];

  lessonData.forEach(module => {
    const modHeader = document.createElement('div');
    modHeader.className = 'module-header';
    modHeader.innerHTML = `<h4>${escapeHtml(module.module)}</h4><span>${escapeHtml(String(module.lessons.length))} aulas</span>`;
    list.appendChild(modHeader);

    module.lessons.forEach((lesson, i) => {
      const item = document.createElement('div');
      item.className = 'lesson-item' + (lesson.done ? ' completed' : '') + (i === 0 ? ' active' : '');
      item.innerHTML = `
        <span class="lesson-number">${lesson.done ? '<i class="fas fa-check" style="color:var(--red)"></i>' : escapeHtml(String(lesson.id))}</span>
        <div class="lesson-thumb">
          <img src="${escapeHtml(lesson.thumb)}" alt="${escapeHtml(lesson.title)}" loading="lazy" />
          ${lesson.done ? '<div class="done-overlay"><i class="fas fa-check"></i></div>' : ''}
        </div>
        <div class="lesson-details">
          <h4>${escapeHtml(lesson.title)}</h4>
          <span><i class="fas fa-clock" style="margin-right:4px"></i>${escapeHtml(lesson.duration)}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        if (lt) lt.textContent = `Aula ${lesson.id}: ${lesson.title}`;
        showToast(`Carregando: ${lesson.title}`, 'fa-play-circle');
        if (vImg) vImg.src = lesson.thumb;
      });
      list.appendChild(item);
    });
  });
}

/* ---- MY COURSES PAGE ---- */
if (document.getElementById('myCoursesGrid')) {
  const grid = document.getElementById('myCoursesGrid');
  const enrolled = COURSES.filter(c => c.progress !== undefined);
  enrolled.forEach(c => {
    const card = createCourseCard(c, { showProgress: c.progress > 0 });
    card.style.minWidth = 'unset';
    card.style.maxWidth = 'unset';
    grid.appendChild(card);
  });
}

/* ---- SUPABASE: logout e MY_LIST ---- */

// MY_LIST: inicializado vazio; populado quando auth completa
let MY_LIST = [];

// Quando auth.js completar (evento vgr:auth-ready), atualizar MY_LIST e re-renderizar
document.addEventListener('vgr:auth-ready', (e) => {
  const user = e.detail;
  if (!user) return;

  // Sincronizar MY_LIST com a lista salva no perfil Supabase
  MY_LIST = Array.isArray(user.myList) ? user.myList : [];

  // Re-renderizar carrossel "Minha Lista" se estiver na index
  if (document.getElementById('mylist')) {
    const mylistCourses = COURSES.filter(c => MY_LIST.includes(c.id));
    populateCarousel('mylist', mylistCourses);
  }
});

// Logout via Supabase (intercepta todos os links/botões de "Sair")
document.addEventListener('click', async (e) => {
  const link = e.target.closest('a[href="login.html"]');
  if (!link) return;
  // Verificar se é o link de logout (contém ícone de sign-out ou texto "Sair")
  if (link.textContent.includes('Sair') || link.querySelector('.fa-sign-out-alt')) {
    e.preventDefault();
    try {
      if (window.supabaseClient) await supabaseClient.auth.signOut();
    } catch (_) {}
    window.location.href = 'login.html';
  }
});
