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
    try {
      const { error } = await supabaseClient
        .from('platform_settings')
        .upsert({ id: 1, ...cfg, updated_at: new Date().toISOString() });
      if (error) throw error;
      return true;
    } catch (e) {
      // Tenta salvar sem o campo trails (pode não existir ainda no banco)
      try {
        const { trails: _t, ...cfgSemTrails } = cfg;
        const { error: e2 } = await supabaseClient
          .from('platform_settings')
          .upsert({ id: 1, ...cfgSemTrails, updated_at: new Date().toISOString() });
        if (e2) throw e2;
        console.warn('[SupabaseDB] Salvo sem trails. Execute o SQL de migração para ativar trilhas.');
        return true;
      } catch (e3) {
        console.error('[SupabaseDB] saveSettings:', e.message, '| fallback:', e3.message);
        return false;
      }
    }
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
    try {
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
        updated_at:  new Date().toISOString(),
      };
      // Se tem ID numérico real (não gerado localmente), faz upsert
      if (course.id && typeof course.id === 'number' && course.id < 2000000000) {
        row.id = course.id;
      }
      const { data, error } = await supabaseClient
        .from('courses')
        .upsert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[SupabaseDB] saveCourse:', e.message);
      return null;
    }
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
      featured: Array.isArray(row.featured_ids) ? row.featured_ids : [],
      trails:   Array.isArray(row.trails) ? row.trails : [],
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
      featured_ids:            state.featured  || [],
      trails:                  state.trails    || [],
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
      progress:     0,
    };
  },
};

window.SupabaseDB = SupabaseDB;
