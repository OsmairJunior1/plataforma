// =====================================================
//  SKILLFLIX — DATABASE (localStorage)
//  Fonte única de verdade para toda a plataforma
// =====================================================

const DB_KEY = 'skillflix_db';

const DB_DEFAULTS = {
  version: 2,
  platform: { name: 'SkillFlix', tagline: 'Sua Plataforma de Cursos', primaryColor: '#e50914', logoText: 'SKILL', logoSpan: 'FLIX' },
  banners: [
    {
      id: 1, active: true, order: 0,
      mediaType: 'video',
      mediaUrl: 'Hoje nossa reuni%C3%A3o no BNI foi marcada por conex%C3%B5es poderosas e muita gera%C3%A7%C3%A3o de neg%C3%B3cios.Tivemos.mp4',
      posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80',
      badge: 'Em Destaque', titleLine1: 'Aprendendo a fazer', titleLine2: 'Networking Intencional', titleHighlight: true,
      description: 'Conheça as estratégias mais poderosas utilizadas por Luccas Cavalli, uma das pessoas de maior influência no meio do BNI.',
      linkUrl: 'curso.html?id=1', linkLabel: 'Assistir Agora'
    }
  ],
  courses: [],
  featured: [1, 3, 7, 11],
  trails: [
    { id: 1, name: 'Networking & Negócios', color: '#e50914', desc: 'Do networking ao fechamento de negócios.', courses: [1, 4, 7] },
    { id: 2, name: 'Marketing Completo', color: '#f5a623', desc: 'Estratégias de marketing do zero ao avançado.', courses: [2, 3, 5, 12] },
    { id: 3, name: 'Tech & Automação', color: '#00d4aa', desc: 'Tecnologia e automação para o seu negócio.', courses: [8] },
  ],
  users: [
    {
      id: 'u_admin', name: 'Administrador', email: 'admin@skillflix.com',
      password: btoa('admin123'), plan: 'admin', active: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=e50914&color=fff&size=80',
      createdAt: new Date().toISOString(), disabledCourses: [],
      points: 0, badges: [], myList: [], progress: {}
    }
  ],
  comments: [],
  forum: [],
  gamification: {
    actions: { watch_lesson: 10, complete_course: 100, post_comment: 5, post_forum: 15, answer_forum: 10, like_received: 2, answer_accepted: 25, daily_login: 3 },
    levels: [
      { level: 1, name: 'Iniciante', minPoints: 0,    color: '#aaa',    icon: 'fa-seedling' },
      { level: 2, name: 'Aprendiz',  minPoints: 100,  color: '#00c853', icon: 'fa-book-open' },
      { level: 3, name: 'Praticante',minPoints: 300,  color: '#2196f3', icon: 'fa-dumbbell' },
      { level: 4, name: 'Expert',    minPoints: 700,  color: '#9c27b0', icon: 'fa-star' },
      { level: 5, name: 'Mestre',    minPoints: 1500, color: '#ffd700', icon: 'fa-crown' },
    ],
    badges: [
      { id: 'first_login',    name: 'Bem-vindo!',           icon: 'fa-hand-wave',   desc: 'Fez o primeiro login',            color: '#00c853' },
      { id: 'first_lesson',   name: 'Primeiro Passo',       icon: 'fa-shoe-prints', desc: 'Assistiu a primeira aula',        color: '#2196f3' },
      { id: 'ten_lessons',    name: 'Aluno Dedicado',       icon: 'fa-medal',       desc: 'Assistiu 10 aulas',              color: '#9c27b0' },
      { id: 'first_course',   name: 'Concluidor',           icon: 'fa-trophy',      desc: 'Concluiu o primeiro curso',       color: '#ffd700' },
      { id: 'three_courses',  name: 'Maratonista',          icon: 'fa-fire',        desc: 'Concluiu 3 cursos',              color: '#ff6b35' },
      { id: 'community_star', name: 'Estrela da Comunidade',icon: 'fa-star',        desc: 'Criou 5 tópicos no fórum',       color: '#f5a623' },
      { id: 'helper',         name: 'Mentor',               icon: 'fa-hands-helping',desc: 'Teve resposta aceita no fórum', color: '#00d4aa' },
      { id: 'networker',      name: 'Networker',            icon: 'fa-network-wired',desc: '200 pontos acumulados',          color: '#e50914' },
    ]
  },
  activity: [],
  session: null
};

// ---- INIT ----
function DB_init() {
  let db = DB_load();
  if (!db) {
    db = { ...DB_DEFAULTS, courses: typeof COURSES !== 'undefined' ? JSON.parse(JSON.stringify(COURSES)) : [] };
    DB_save(db);
    return db;
  }
  // Migração: copiar cursos do data.js se db.courses estiver vazio
  if ((!db.courses || !db.courses.length) && typeof COURSES !== 'undefined') {
    db.courses = JSON.parse(JSON.stringify(COURSES));
    DB_save(db);
  }
  // Migração do esquema antigo (eduflix_admin)
  const oldData = localStorage.getItem('eduflix_admin');
  if (oldData && !db._migrated) {
    try {
      const old = JSON.parse(oldData);
      if (old.platform) db.platform = { ...db.platform, ...old.platform };
      if (old.courses?.length) db.courses = old.courses;
      if (old.featured) db.featured = old.featured;
      if (old.trails) db.trails = old.trails;
      if (old.banners) db.banners = old.banners;
      db._migrated = true;
      DB_save(db);
    } catch(e) {}
  }
  return db;
}

function DB_load() {
  try { const d = localStorage.getItem(DB_KEY); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}
function DB_save(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch(e) { console.error('DB_save error', e); }
}
function DB_get() { return DB_load() || DB_init(); }
function DB_update(fn) { const db = DB_get(); fn(db); DB_save(db); return db; }

// ---- PLATFORM ----
const DB = {
  getPlatform: () => DB_get().platform,
  savePlatform: (p) => DB_update(db => db.platform = { ...db.platform, ...p }),

  // ---- BANNERS ----
  getBanners: () => (DB_get().banners || []).filter(b => b.active).sort((a,b) => a.order - b.order),
  getAllBanners: () => (DB_get().banners || []).sort((a,b) => a.order - b.order),
  saveBanner: (banner) => DB_update(db => {
    const idx = db.banners.findIndex(b => b.id === banner.id);
    if (idx > -1) db.banners[idx] = banner;
    else { banner.id = Date.now(); db.banners.push(banner); }
  }),
  deleteBanner: (id) => DB_update(db => db.banners = db.banners.filter(b => b.id !== id)),
  reorderBanners: (ids) => DB_update(db => ids.forEach((id, i) => { const b = db.banners.find(b => b.id === id); if(b) b.order = i; })),

  // ---- COURSES ----
  getCourses: () => DB_get().courses || [],
  getCourse: (id) => (DB_get().courses || []).find(c => c.id === id),
  saveCourse: (course) => DB_update(db => {
    const idx = db.courses.findIndex(c => c.id === course.id);
    if (idx > -1) db.courses[idx] = course;
    else { course.id = Date.now(); db.courses.push(course); }
  }),
  deleteCourse: (id) => DB_update(db => { db.courses = db.courses.filter(c => c.id !== id); db.featured = db.featured.filter(f => f !== id); }),
  getFeatured: () => DB_get().featured || [],
  saveFeatured: (ids) => DB_update(db => db.featured = ids),

  // ---- TRAILS ----
  getTrails: () => DB_get().trails || [],
  saveTrail: (trail) => DB_update(db => {
    const idx = db.trails.findIndex(t => t.id === trail.id);
    if (idx > -1) db.trails[idx] = trail;
    else { trail.id = Date.now(); db.trails.push(trail); }
  }),
  deleteTrail: (id) => DB_update(db => db.trails = db.trails.filter(t => t.id !== id)),

  // ---- USERS ----
  getUsers: () => DB_get().users || [],
  getUser: (id) => (DB_get().users || []).find(u => u.id === id),
  getUserByEmail: (email) => (DB_get().users || []).find(u => u.email.toLowerCase() === email.toLowerCase()),
  saveUser: (user) => DB_update(db => {
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx > -1) db.users[idx] = user;
    else db.users.push(user);
  }),
  deleteUser: (id) => DB_update(db => db.users = db.users.filter(u => u.id !== id)),
  registerUser: (data) => {
    const db = DB_get();
    if (db.users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) return { error: 'E-mail já cadastrado.' };
    const user = {
      id: 'u_' + Date.now(), name: data.name, email: data.email,
      password: btoa(data.password), plan: data.plan || 'free', active: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=e50914&color=fff&size=80`,
      createdAt: new Date().toISOString(), disabledCourses: [],
      points: 0, badges: [], myList: [], progress: {}
    };
    DB_update(db => db.users.push(user));
    DB.awardPoints(user.id, 'first_login');
    return { user };
  },

  // ---- SESSION ----
  getSession: () => { try { const s = localStorage.getItem('skillflix_session'); return s ? JSON.parse(s) : null; } catch(e) { return null; } },
  setSession: (userId) => { localStorage.setItem('skillflix_session', JSON.stringify({ userId, loginAt: new Date().toISOString() })); },
  clearSession: () => localStorage.removeItem('skillflix_session'),
  getCurrentUser: () => { const s = DB.getSession(); return s ? DB.getUser(s.userId) : null; },
  login: (email, password) => {
    const user = DB.getUserByEmail(email);
    if (!user) return { error: 'E-mail não encontrado.' };
    if (!user.active) return { error: 'Conta desativada. Entre em contato com o suporte.' };
    if (user.password !== btoa(password)) return { error: 'Senha incorreta.' };
    DB.setSession(user.id);
    DB.awardPoints(user.id, 'daily_login');
    return { user };
  },
  logout: () => { DB.clearSession(); window.location.href = 'login.html'; },

  // ---- COMMENTS ----
  getComments: (courseId) => (DB_get().comments || []).filter(c => !courseId || c.courseId == courseId),
  getAllComments: () => DB_get().comments || [],
  saveComment: (comment) => DB_update(db => {
    if (!db.comments) db.comments = [];
    const idx = db.comments.findIndex(c => c.id === comment.id);
    if (idx > -1) db.comments[idx] = comment;
    else { comment.id = 'c_' + Date.now(); db.comments.push(comment); }
  }),
  deleteComment: (id) => DB_update(db => db.comments = db.comments.filter(c => c.id !== id)),
  replyComment: (id, reply, adminName) => DB_update(db => {
    const c = db.comments.find(c => c.id === id);
    if (c) { c.adminReply = reply; c.adminRepliedAt = new Date().toISOString(); c.adminName = adminName || 'SkillFlix'; c.status = 'replied'; }
  }),

  // ---- FORUM ----
  getForumTopics: () => (DB_get().forum || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
  getForumTopic: (id) => (DB_get().forum || []).find(t => t.id === id),
  saveTopic: (topic) => DB_update(db => {
    if (!db.forum) db.forum = [];
    const idx = db.forum.findIndex(t => t.id === topic.id);
    if (idx > -1) db.forum[idx] = topic;
    else { topic.id = 'f_' + Date.now(); topic.createdAt = new Date().toISOString(); topic.views = 0; topic.answers = []; topic.likes = []; db.forum.push(topic); }
  }),
  deleteTopic: (id) => DB_update(db => db.forum = db.forum.filter(t => t.id !== id)),
  addAnswer: (topicId, answer) => DB_update(db => {
    const t = db.forum.find(t => t.id === topicId);
    if (t) { answer.id = 'a_' + Date.now(); answer.createdAt = new Date().toISOString(); answer.likes = []; answer.isAccepted = false; t.answers.push(answer); }
  }),
  acceptAnswer: (topicId, answerId) => DB_update(db => {
    const t = db.forum.find(t => t.id === topicId);
    if (t) { t.solved = true; t.acceptedAnswerId = answerId; t.answers.forEach(a => a.isAccepted = a.id === answerId); }
  }),

  // ---- USER PROGRESS ----
  saveProgress: (userId, courseId, data) => DB_update(db => {
    const u = db.users.find(u => u.id === userId);
    if (u) { if (!u.progress) u.progress = {}; u.progress[courseId] = { ...u.progress[courseId], ...data, lastWatched: new Date().toISOString() }; }
  }),
  getProgress: (userId, courseId) => { const u = DB.getUser(userId); return u?.progress?.[courseId] || null; },

  // ---- MY LIST ----
  getMyList: (userId) => DB.getUser(userId)?.myList || [],
  toggleMyList: (userId, courseId) => DB_update(db => {
    const u = db.users.find(u => u.id === userId);
    if (!u) return;
    if (!u.myList) u.myList = [];
    const idx = u.myList.indexOf(courseId);
    if (idx === -1) u.myList.push(courseId); else u.myList.splice(idx, 1);
  }),

  // ---- GAMIFICATION ----
  awardPoints: (userId, action) => {
    const db = DB_get();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    const pts = db.gamification?.actions?.[action] || 0;
    if (!pts) return;
    user.points = (user.points || 0) + pts;
    // Verificar badges
    const allBadges = db.gamification?.badges || [];
    const earned = [];
    const stats = DB._getUserStats(userId, db);
    allBadges.forEach(badge => {
      if (!user.badges.includes(badge.id) && DB._checkBadge(badge.id, stats)) {
        user.badges.push(badge.id);
        earned.push(badge);
      }
    });
    DB_save(db);
    return earned;
  },
  _getUserStats: (userId, db) => {
    const user = db.users.find(u => u.id === userId);
    if (!user) return {};
    const comments = (db.comments || []).filter(c => c.userId === userId);
    const topics = (db.forum || []).filter(t => t.userId === userId);
    const answers = (db.forum || []).flatMap(t => t.answers || []).filter(a => a.userId === userId);
    const completedCourses = Object.values(user.progress || {}).filter(p => p.percent >= 100).length;
    const watchedLessons = Object.values(user.progress || {}).reduce((sum, p) => sum + (p.completedLessons?.length || 0), 0);
    return { points: user.points, watchedLessons, completedCourses, comments: comments.length, topics: topics.length, answers: answers.length };
  },
  _checkBadge: (badgeId, stats) => {
    const checks = {
      first_login:    () => true,
      first_lesson:   () => stats.watchedLessons >= 1,
      ten_lessons:    () => stats.watchedLessons >= 10,
      first_course:   () => stats.completedCourses >= 1,
      three_courses:  () => stats.completedCourses >= 3,
      community_star: () => stats.topics >= 5,
      helper:         () => false, // set manually when answer accepted
      networker:      () => stats.points >= 200,
    };
    return checks[badgeId] ? checks[badgeId]() : false;
  },
  getRanking: () => {
    const users = DB.getUsers().filter(u => u.plan !== 'admin');
    return users.sort((a,b) => (b.points||0) - (a.points||0)).map((u, i) => ({ ...u, rank: i + 1 }));
  },
  getUserLevel: (points) => {
    const levels = DB_get().gamification?.levels || DB_DEFAULTS.gamification.levels;
    let current = levels[0];
    for (const l of levels) { if (points >= l.minPoints) current = l; }
    return current;
  },

  // ---- ACTIVITY LOG ----
  log: (msg, icon = 'fa-circle', color = '#2196f3') => DB_update(db => {
    if (!db.activity) db.activity = [];
    db.activity.push({ msg, icon, color, time: new Date().toLocaleString('pt-BR') });
    if (db.activity.length > 50) db.activity = db.activity.slice(-50);
  }),
};

// Auto-inicializar
const _db = DB_init();
