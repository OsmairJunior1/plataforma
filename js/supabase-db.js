// =====================================================
//  VGR ACADEMY — SUPABASE DATA LAYER
//  Camada única de acesso ao banco compartilhado.
//  Leitura: qualquer visitante (RLS: select_all / select_active)
//  Escrita:  somente admin autenticado via Supabase
// =====================================================

const SupabaseDB = {

  _ok() { return !!window.supabaseClient; },

  // --------------------------------------------------
  //  PLATFORM SETTINGS
  // --------------------------------------------------

  /** Retorna as configurações da plataforma (uma única linha, id=1). */
  async getSettings() {
    if (!this._ok()) return null;
    try {
      const { data, error } = await supabaseClient
        .from('platform_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[SupabaseDB] getSettings:', e.message);
      return null;
    }
  },

  /**
   * Salva as configurações no banco.
   * @param {Object} cfg  Objeto mapeado de adminState para colunas Supabase
   */
  async saveSettings(cfg) {
    if (!this._ok()) return false;

    // Tentativas progressivas — trata colunas ausentes no banco (trails, home_sections)
    const strip = (obj, ...keys) => {
      const r = { ...obj };
      keys.forEach(k => delete r[k]);
      return r;
    };

    const attempts = [
      { payload: cfg,                                          label: 'completo' },
      { payload: strip(cfg, 'trails'),                        label: 'sem trails' },
      { payload: strip(cfg, 'home_sections'),                 label: 'sem home_sections' },
      { payload: strip(cfg, 'trails', 'home_sections'),       label: 'sem trails+home_sections' },
    ];

    for (const { payload, label } of attempts) {
      try {
        const { error } = await supabaseClient
          .from('platform_settings')
          .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() });
        if (!error) {
          if (label !== 'completo') {
            console.warn(`[SupabaseDB] Salvo (${label}). Execute o SQL de migração para ativar todas as colunas.`);
          }
          return { ok: true, label };
        }
      } catch (_) { /* tenta próxima variante */ }
    }

    console.error('[SupabaseDB] saveSettings: todas as tentativas falharam.');
    return { ok: false, label: null };
  },

  // --------------------------------------------------
  //  COURSES
  // --------------------------------------------------

  /** Retorna todos os cursos ativos (qualquer visitante pode ler). */
  async getCourses({ activeOnly = true } = {}) {
    if (!this._ok()) return null;
    try {
      let q = supabaseClient
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true });
      if (activeOnly) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[SupabaseDB] getCourses:', e.message);
      return null;
    }
  },

  /** Cria ou atualiza um curso. Requer sessão de admin. */
  async saveCourse(course) {
    if (!this._ok()) return null;

    const strip = (obj, ...keys) => { const r = { ...obj }; keys.forEach(k => delete r[k]); return r; };

    // Mapear campo local → Supabase
    const row = {
      title:       course.title,
      description: course.desc || course.description || '',
      instructor:  course.instructor || '',
      category:    course.category   || 'geral',
      level:       course.level      || 'Iniciante',
      duration:    course.duration   || '',
      lessons:     course.lessons    || 0,
      rating:      course.rating     || 4.8,
      thumb:       course.thumb      || '',
      hero:        course.hero       || '',
      badge:       course.badge      || '',
      tags:        course.tags       || [],
      active:        course.active !== false,
      featured:      course.featured      || false,
      sort_order:    course.sort_order    || 0,
      plan_required: course.planRequired  || 'free',
      watch_url:     course.watchUrl      || '',
      details:       course.details       || '',
      modules:       course.modules       || [],
      materials:     course.materials     || [],
      updated_at:  new Date().toISOString(),
    };

    // Se tem ID real (number ou string numérica), inclui no upsert para UPDATE
    const numId = Number(course.id);
    if (course.id && !isNaN(numId) && numId > 0 && numId < 2000000000) {
      row.id = numId;
    }

    // Progressive fallback — tenta com colunas novas; se a tabela não tiver as colunas ainda, remove-as
    const attempts = [
      row,
      strip(row, 'modules', 'materials'),
      strip(row, 'modules'),
      strip(row, 'materials'),
    ];

    for (const payload of attempts) {
      try {
        const { data, error } = await supabaseClient
          .from('courses')
          .upsert(payload)
          .select()
          .single();
        if (!error) return data;
        if (!error.message?.includes('column')) throw error; // real error, don't retry
      } catch (e) {
        if (!e.message?.includes('column')) {
          console.error('[SupabaseDB] saveCourse:', e.message);
          return null;
        }
      }
    }
    console.error('[SupabaseDB] saveCourse: todas tentativas falharam. Execute a migração SQL.');
    return null;
  },

  /** Remove um curso. Requer sessão de admin. */
  async deleteCourse(id) {
    if (!this._ok()) return false;
    try {
      const { error } = await supabaseClient
        .from('courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('[SupabaseDB] deleteCourse:', e.message);
      return false;
    }
  },

  // --------------------------------------------------
  //  MAPEAMENTO: Supabase row → adminState / app
  // --------------------------------------------------

  /** Converte uma linha do Supabase para o formato interno do adminState. */
  settingsToState(row) {
    if (!row) return null;
    return {
      platform: {
        name:         row.name          || 'VGR Academy',
        tagline:      row.tagline       || 'Sua Plataforma de Cursos',
        primaryColor: row.primary_color || '#e50914',
        logoText:     row.logo_text     || 'VGR',
        logoSpan:     row.logo_span     || 'ACADEMY',
      },
      hero: {
        type:            row.hero_type             || 'video',
        url:             row.hero_url              || '',
        poster:          row.hero_poster           || '',
        badge:           row.hero_badge            || 'Em Destaque',
        titleLine1:      row.hero_title_1          || '',
        titleLine2:      row.hero_title_2          || '',
        titleHighlight:  row.hero_title_highlight  !== false,
        description:     row.hero_description      || '',
        featuredCourseId: row.hero_featured_course_id || null,
      },
      landing: {
        videoType:   row.landing_video_type   || 'video',
        videoUrl:    row.landing_video_url    || '',
        videoPoster: row.landing_video_poster || '',
      },
      featured:     Array.isArray(row.featured_ids)  ? row.featured_ids  : [],
      trails:       Array.isArray(row.trails)         ? row.trails         : [],
      homeSections: row.home_sections && typeof row.home_sections === 'object' ? row.home_sections : null,
    };
  },

  /** Converte adminState → objeto de colunas para salvar no Supabase. */
  stateToSettings(state) {
    const p = state.platform || {};
    const h = state.hero     || {};
    const l = state.landing  || {};
    return {
      name:                    p.name          || 'VGR Academy',
      tagline:                 p.tagline       || '',
      primary_color:           p.primaryColor  || '#e50914',
      logo_text:               p.logoText      || 'VGR',
      logo_span:               p.logoSpan      || 'ACADEMY',
      hero_type:               h.type          || 'video',
      hero_url:                h.url           || '',
      hero_poster:             h.poster        || '',
      hero_badge:              h.badge         || 'Em Destaque',
      hero_title_1:            h.titleLine1    || '',
      hero_title_2:            h.titleLine2    || '',
      hero_title_highlight:    h.titleHighlight !== false,
      hero_description:        h.description   || '',
      hero_featured_course_id: h.featuredCourseId || null,
      landing_video_type:      l.videoType     || 'video',
      landing_video_url:       l.videoUrl      || '',
      landing_video_poster:    l.videoPoster   || '',
      featured_ids:            state.featured      || [],
      trails:                  state.trails        || [],
      home_sections:           state.homeSections  || null,
    };
  },

  /** Converte linha do Supabase para formato local de curso. */
  courseToLocal(row) {
    if (!row) return null;
    return {
      id:         row.id,
      title:      row.title,
      desc:       row.description,
      instructor: row.instructor,
      category:   row.category,
      level:      row.level,
      duration:   row.duration,
      lessons:    row.lessons,
      rating:     parseFloat(row.rating),
      thumb:      row.thumb,
      hero:       row.hero,
      badge:      row.badge,
      tags:       row.tags || [],
      active:       row.active,
      featured:     row.featured,
      sort_order:   row.sort_order,
      planRequired: row.plan_required || 'free',
      watchUrl:     row.watch_url     || '',
      details:      row.details       || '',
      modules:      row.modules    || [],
      materials:    row.materials  || [],
      progress:     0,
    };
  },
};

window.SupabaseDB = SupabaseDB;
