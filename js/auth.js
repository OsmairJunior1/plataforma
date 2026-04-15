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
    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Perfil não existe (trigger não rodou ou novo usuário) → cria agora
    if (profileError?.code === 'PGRST116' || (!profile && !profileError)) {
      const userName = session.user.user_metadata?.name
                    || session.user.email.split('@')[0];
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e50914&color=fff&size=80`;

      const { data: newProfile } = await supabaseClient
        .from('profiles')
        .insert({ id: session.user.id, name: userName, avatar, plan: 'free' })
        .select('*')
        .single();

      profile = newProfile;
    }

    // Erro real (ex: permissão) — mas não deslogamos; tentamos continuar sem perfil
    if (!profile) {
      console.warn('[auth] Perfil não disponível, continuando sem dados de perfil.');
      document.body.style.visibility = 'visible';
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

    // Atualiza avatar e nome do usuário na navbar
    _updateNavUser(profile);

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

/** Atualiza avatar e nome na navbar com os dados reais do usuário. */
function _updateNavUser(profile) {
  // Avatar
  const avatarImg = document.querySelector('.user-menu .avatar img');
  if (avatarImg && profile.avatar) avatarImg.src = profile.avatar;

  // Nome exibido ao lado do avatar (se existir o span)
  const nameSpan = document.querySelector('.user-menu .avatar .user-display-name');
  if (nameSpan) nameSpan.textContent = (profile.name || '').split(' ')[0];
}
