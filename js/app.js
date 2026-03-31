// =====================================================
//  SKILLFLIX — APP MAIN SCRIPT
// =====================================================

/* ---- CARREGAR ESTADO DO PAINEL (localStorage) ---- */
const DEFAULT_STATE = {
  platform: { name: 'SkillFlix', tagline: 'Sua Plataforma de Cursos', primaryColor: '#e50914', logoText: 'SKILL', logoSpan: 'FLIX' },
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
    const saved = localStorage.getItem('eduflix_admin');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  // Retorna o estado padrão com os cursos do data.js
  return { ...DEFAULT_STATE, courses: COURSES };
}

function applyAdminState() {
  const state = getAdminState();
  if (!state) return;

  // --- Plataforma: logo e nome ---
  const { platform, hero, featured, courses } = state;
  if (platform) {
    // Atualiza logo em todos os elementos com id="siteLogo"
    document.querySelectorAll('#siteLogo, .logo').forEach(el => {
      el.innerHTML = `${platform.logoText || 'SKILL'}<span>${platform.logoSpan || 'FLIX'}</span>`;
    });
    // Atualiza login-logo se existir
    const loginLogo = document.querySelector('.login-logo');
    if (loginLogo) loginLogo.innerHTML = `${platform.logoText || 'SKILL'}<span>${platform.logoSpan || 'FLIX'}</span>`;
    // Atualiza footer logo
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) footerLogo.innerHTML = `${platform.logoText || 'SKILL'}<span>${platform.logoSpan || 'FLIX'}</span>`;
    // Cor principal
    if (platform.primaryColor) {
      document.documentElement.style.setProperty('--red', platform.primaryColor);
    }
    // Título da aba
    document.title = document.title.replace(/SkillFlix|EduFlix/g, platform.name || 'SkillFlix');
  }

  // --- Hero (apenas na index) ---
  if (hero && document.getElementById('heroBg')) {
    // Mídia de fundo
    const heroBg = document.getElementById('heroBg');
    const overlay = heroBg.querySelector('.hero-overlay');
    // Remove mídia antiga se existir
    heroBg.querySelectorAll('video, img.hero-video, img.hero-img').forEach(el => el.remove());
    if (hero.type === 'video') {
      const vid = document.createElement('video');
      vid.className = 'hero-video';
      vid.autoplay = true;
      vid.muted = true;
      vid.loop = true;
      vid.setAttribute('playsinline', '');
      if (hero.poster) vid.poster = hero.poster;
      const src = document.createElement('source');
      src.src = hero.url || '';
      src.type = 'video/mp4';
      vid.appendChild(src);
      heroBg.insertBefore(vid, overlay);
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
      titleEl.innerHTML = `${hero.titleLine1 || ''}<br /><span style="color:${highlight ? 'var(--red)' : 'inherit'}">${hero.titleLine2 || ''}</span>`;
    }

    const descEl = document.getElementById('heroDescEl');
    if (descEl) descEl.textContent = hero.description || '';

    // Meta do curso em destaque
    const metaEl = document.getElementById('heroMetaEl');
    const featuredCourse = courses?.find(c => c.id === hero.featuredCourseId) || courses?.[0];
    if (metaEl && featuredCourse) {
      metaEl.innerHTML = `
        <span class="rating"><i class="fas fa-star"></i> ${featuredCourse.rating}</span>
        <span class="separator">•</span>
        <span>${featuredCourse.lessons} aulas</span>
        <span class="separator">•</span>
        <span>${featuredCourse.duration}</span>
        <span class="separator">•</span>
        <span class="badge-level">${featuredCourse.level}</span>
      `;
      const watchBtn = document.getElementById('heroWatchBtn');
      if (watchBtn) watchBtn.href = `curso.html?id=${featuredCourse.id}`;
    }
  }

  // --- Usar cursos do painel nos carrosséis ---
  if (courses && courses.length) {
    // Sobrescreve o array COURSES global com os dados do painel
    COURSES.length = 0;
    courses.forEach(c => COURSES.push(c));
  }
}

// Executa antes de tudo
applyAdminState();

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
  card.className = 'course-card' + (showTop10 ? ' top10-card' : '');
  card.dataset.id = course.id;

  const badgeHTML = course.badge
    ? `<span class="card-badge badge-${course.badge}">${course.badge === 'new' ? 'Novo' : course.badge === 'hot' ? '🔥 Hot' : course.badge === 'free' ? 'Grátis' : '⭐ Top'}</span>`
    : '';

  const progressHTML = showProgress && course.progress > 0
    ? `<div class="card-progress"><div class="card-progress-fill" style="width:${course.progress}%"></div></div>`
    : '';

  const top10HTML = showTop10
    ? `<span class="top10-number">${index + 1}</span>`
    : '';

  const inList = MY_LIST.includes(course.id);

  card.innerHTML = `
    <div class="card-thumb">
      <img src="${course.thumb}" alt="${course.title}" loading="lazy" />
      <div class="card-play-btn"><i class="fas fa-play"></i></div>
      <div class="card-badges">${badgeHTML}</div>
      ${top10HTML}
      ${progressHTML}
    </div>
    <div class="card-body">
      <div class="card-title">${course.title}</div>
      <div class="card-meta">
        <span class="star"><i class="fas fa-star"></i> ${course.rating}</span>
        <span>${course.lessons} aulas</span>
        <span>${course.level}</span>
      </div>
    </div>
    <div class="card-expanded">
      <p>${course.desc}</p>
      <div class="card-actions">
        <button class="card-btn play-small" data-action="play" title="Assistir"><i class="fas fa-play"></i></button>
        <button class="card-btn btn-addlist" data-action="list" title="${inList ? 'Remover da lista' : 'Adicionar à lista'}">
          <i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i>
        </button>
        <button class="card-btn" data-action="info" title="Mais info"><i class="fas fa-info"></i></button>
        <span style="margin-left:auto;font-size:0.7rem;color:var(--gray)">${course.duration}</span>
      </div>
    </div>
  `;

  // Card actions
  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
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

/* ---- POPULATE CAROUSELS ---- */
function populateCarousel(id, courses, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  courses.forEach((course, index) => {
    el.appendChild(createCourseCard(course, { ...opts, index }));
  });
}

// Index page carousels
if (document.getElementById('continue')) {
  const inProgress = COURSES.filter(c => c.progress > 0 && c.progress < 100);
  populateCarousel('continue', inProgress, { showProgress: true });
}
if (document.getElementById('popular')) {
  const popular = [...COURSES].sort((a, b) => b.rating - a.rating).slice(0, 8);
  populateCarousel('popular', popular);
}
if (document.getElementById('new')) {
  const newCourses = COURSES.filter(c => c.badge === 'new' || c.badge === 'hot');
  populateCarousel('new', newCourses);
}
if (document.getElementById('top10')) {
  const top10 = [...COURSES].slice(0, 10);
  populateCarousel('top10', top10, { showTop10: true });
}
if (document.getElementById('mylist')) {
  const mylistCourses = COURSES.filter(c => MY_LIST.includes(c.id));
  populateCarousel('mylist', mylistCourses);
}

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
  document.getElementById('modalWatch').href = `curso.html?id=${course.id}`;

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = course.tags.map(t => `<span>${t}</span>`).join('');

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
    modHeader.innerHTML = `<h4>${module.module}</h4><span>${module.lessons.length} aulas</span>`;
    list.appendChild(modHeader);

    module.lessons.forEach((lesson, i) => {
      const item = document.createElement('div');
      item.className = 'lesson-item' + (lesson.done ? ' completed' : '') + (i === 0 ? ' active' : '');
      item.innerHTML = `
        <span class="lesson-number">${lesson.done ? '<i class="fas fa-check" style="color:var(--red)"></i>' : lesson.id}</span>
        <div class="lesson-thumb">
          <img src="${lesson.thumb}" alt="${lesson.title}" loading="lazy" />
          ${lesson.done ? '<div class="done-overlay"><i class="fas fa-check"></i></div>' : ''}
        </div>
        <div class="lesson-details">
          <h4>${lesson.title}</h4>
          <span><i class="fas fa-clock" style="margin-right:4px"></i>${lesson.duration}</span>
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
