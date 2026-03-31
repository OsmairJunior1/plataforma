// =====================================================
//  SKILLFLIX — AUTH GUARD
//  Inclua este script em todas as páginas protegidas
// =====================================================

(function() {
  const PUBLIC_PAGES = ['login.html', 'landing.html', 'registro.html', 'index.html'];
  const ADMIN_PAGES  = ['admin.html'];

  const path = window.location.pathname.split('/').pop() || 'index.html';
  const session = DB.getSession();
  const user = session ? DB.getUser(session.userId) : null;

  // Redirecionar para login se não logado em página protegida
  if (!PUBLIC_PAGES.includes(path) && !session) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(path);
    throw new Error('redirect');
  }

  // Bloquear acesso ao admin para não-admins
  if (ADMIN_PAGES.includes(path) && user?.plan !== 'admin') {
    window.location.href = 'index.html';
    throw new Error('unauthorized');
  }

  // Expor usuário atual globalmente
  window.CURRENT_USER = user;
})();
