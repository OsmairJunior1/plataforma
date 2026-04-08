// =====================================================
//  VGR ACADEMY — AUTH GUARD (Supabase)
//  Dependências (em ordem): supabase CDN, supabase-config.js
// =====================================================

(async function () {
  const PUBLIC_PAGES = ['login.html', 'index.html', 'landing.html', 'registro.html'];
  const ADMIN_PAGES  = ['admin.html'];

  const path = window.location.pathname.split('/').pop() || 'index.html';

  // Ocultar body durante verificação para evitar flash de conteúdo não autorizado
  if (!PUBLIC_PAGES.includes(path)) {
    document.body.style.visibility = 'hidden';
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
      if (!PUBLIC_PAGES.includes(path)) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(path);
        return;
      }
      document.body.style.visibility = 'visible';
      return;
    }

    // Buscar perfil do usuário no banco
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      // Perfil não encontrado — deslogar e redirecionar
      await supabaseClient.auth.signOut();
      window.location.href = 'login.html';
      return;
    }

    // Bloquear acesso ao admin para não-admins
    if (ADMIN_PAGES.includes(path) && profile.plan !== 'admin') {
      window.location.href = 'home.html';
      return;
    }

    // Expor usuário globalmente — sem dados sensíveis
    window.CURRENT_USER = {
      id:      profile.id,
      name:    profile.name,
      email:   session.user.email,
      plan:    profile.plan,
      avatar:  profile.avatar,
      points:  profile.points  || 0,
      badges:  profile.badges  || [],
      myList:  profile.my_list || [],
      progress: {}
    };

    window.SUPABASE_SESSION = session;

    // Sinalizar que auth está pronta para scripts dependentes
    document.dispatchEvent(new CustomEvent('vgr:auth-ready', { detail: window.CURRENT_USER }));

  } catch (err) {
    console.error('[auth] Erro inesperado:', err);
    if (!PUBLIC_PAGES.includes(path)) {
      window.location.href = 'login.html';
      return;
    }
  }

  document.body.style.visibility = 'visible';
})();
