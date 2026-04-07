// =====================================================
//  SKILLFLIX — AUTH GUARD
//  Inclua este script em todas as páginas protegidas
//  DEPENDENCIA: js/db.js deve ser carregado antes
// =====================================================

(function() {
  // Páginas que NÃO exigem autenticação
  // IMPORTANTE: index.html foi removido da lista pública —
  // a home agora exige login, impedindo acesso não autenticado ao conteúdo.
  const PUBLIC_PAGES = ['login.html', 'landing.html', 'registro.html'];

  // Páginas que exigem plano 'admin'
  const ADMIN_PAGES  = ['admin.html'];

  const path = window.location.pathname.split('/').pop() || 'index.html';

  // Obter sessão com validação estrutural (feita dentro de DB.getSession)
  const session = DB.getSession();

  // Validar que o userId da sessão corresponde a um usuário real e ativo no BD.
  // Isso previne que alguém crie manualmente uma sessão via DevTools com um userId
  // arbitrário (ex: userId: 'u_admin') sem ter feito login real.
  const user = session ? DB.getUser(session.userId) : null;
  const isAuthenticated = !!(session && user && user.active);

  // Redirecionar para login se não autenticado em página protegida
  if (!PUBLIC_PAGES.includes(path) && !isAuthenticated) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(path);
    throw new Error('redirect');
  }

  // Verificar plano admin: busca SEMPRE no BD, nunca em variável local ou parâmetro de URL.
  // Isso impede escalada de privilégios via modificação de localStorage da sessão.
  if (ADMIN_PAGES.includes(path)) {
    // Re-buscar do BD para garantir dado fresco
    const freshUser = user ? DB.getUser(user.id) : null;
    if (!freshUser || freshUser.plan !== 'admin') {
      window.location.href = 'index.html';
      throw new Error('unauthorized');
    }
  }

  // Expor usuário atual globalmente — apenas dados não sensíveis.
  // A senha NUNCA deve estar acessível via window.CURRENT_USER.
  if (user) {
    const { password, passwordVersion, passwordLegacyValue, mustChangePassword, ...safeUser } = user;
    window.CURRENT_USER = safeUser;
  } else {
    window.CURRENT_USER = null;
  }
})();
