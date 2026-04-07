// =====================================================
//  SKILLFLIX — GAMIFICATION HELPERS
// =====================================================

function showBadgeEarned(badges) {
  if (!badges || !badges.length) return;
  badges.forEach((badge, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'badge-earned-toast';
      // Usar escapeHtml() nos dados do badge para prevenir XSS
      el.innerHTML = `
        <div class="badge-earned-icon" style="background:color-mix(in srgb,${escapeHtml(badge.color)} 20%,transparent);color:${escapeHtml(badge.color)}">
          <i class="fas ${escapeHtml(badge.icon)}"></i>
        </div>
        <div>
          <strong>Badge conquistado!</strong>
          <p>${escapeHtml(badge.name)}</p>
          <small>${escapeHtml(badge.desc)}</small>
        </div>
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }, i * 600);
  });
}

function getUserLevelHTML(user) {
  if (!user) return '';
  const level = DB.getUserLevel(user.points || 0);
  const levels = DB_get ? DB_get().gamification?.levels : DB_DEFAULTS.gamification.levels;
  const nextLevel = levels?.find(l => l.minPoints > (user.points || 0));
  const progress = nextLevel ? Math.min(100, ((user.points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100) : 100;
  return `
    <div class="user-level-badge" style="--lv-color:${level.color}">
      <i class="fas ${level.icon}" style="color:${level.color}"></i>
      <span>${level.name}</span>
    </div>
    <div class="user-points">${user.points || 0} pts</div>
    ${nextLevel ? `<div class="level-progress"><div class="level-progress-fill" style="width:${progress}%"></div></div>` : ''}
  `;
}

// Registrar aula assistida
function trackLessonWatched(courseId, lessonId) {
  const user = window.CURRENT_USER;
  if (!user) return;
  const progress = DB.getProgress(user.id, courseId) || { completedLessons: [], percent: 0 };
  if (!progress.completedLessons) progress.completedLessons = [];
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
    const course = DB.getCourse(courseId);
    if (course) progress.percent = Math.round((progress.completedLessons.length / (course.lessons || 1)) * 100);
    progress.lastLesson = lessonId;
    DB.saveProgress(user.id, courseId, progress);
    const badges = DB.awardPoints(user.id, 'watch_lesson');
    showBadgeEarned(badges);
    if (progress.percent >= 100) {
      const badges2 = DB.awardPoints(user.id, 'complete_course');
      showBadgeEarned(badges2);
    }
    window.CURRENT_USER = DB.getUser(user.id);
    updateNavbarPoints();
  }
}

function updateNavbarPoints() {
  const user = window.CURRENT_USER;
  if (!user) return;
  const el = document.getElementById('navbarPoints');
  if (el) el.textContent = `${user.points} pts`;
  const lvEl = document.getElementById('navbarLevel');
  const level = DB.getUserLevel(user.points || 0);
  if (lvEl) { lvEl.textContent = level.name; lvEl.style.color = level.color; }
}
