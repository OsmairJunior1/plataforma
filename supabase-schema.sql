-- =====================================================
--  VGR ACADEMY — SUPABASE SCHEMA
--  Execute este arquivo no SQL Editor do Supabase:
--  Painel Supabase → SQL Editor → New query → Cole e rode
-- =====================================================

-- ---- TABELA: profiles (estende auth.users) ----
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT        NOT NULL DEFAULT '',
  plan        TEXT        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'basic', 'premium', 'admin')),
  avatar      TEXT        DEFAULT '',
  points      INTEGER     NOT NULL DEFAULT 0,
  badges      TEXT[]      NOT NULL DEFAULT '{}',
  my_list     INTEGER[]   NOT NULL DEFAULT '{}',
  disabled_courses INTEGER[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- TABELA: courses ----
CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT        DEFAULT '',
  instructor  TEXT        DEFAULT '',
  category    TEXT        DEFAULT 'geral',
  level       TEXT        DEFAULT 'Iniciante',
  duration    TEXT        DEFAULT '',
  lessons     INTEGER     NOT NULL DEFAULT 0,
  rating      NUMERIC(3,1) NOT NULL DEFAULT 4.8,
  thumb       TEXT        DEFAULT '',
  hero        TEXT        DEFAULT '',
  badge       TEXT        DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- TABELA: user_progress ----
CREATE TABLE IF NOT EXISTS user_progress (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id         INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons INTEGER[]   NOT NULL DEFAULT '{}',
  percent           INTEGER     NOT NULL DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  last_lesson       INTEGER,
  last_watched      TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ---- TABELA: comments ----
CREATE TABLE IF NOT EXISTS comments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id        INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content          TEXT        NOT NULL,
  admin_reply      TEXT,
  admin_replied_at TIMESTAMPTZ,
  admin_name       TEXT        DEFAULT 'VGR Academy',
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'replied', 'deleted')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- TABELA: platform_settings (única linha, id=1) ----
CREATE TABLE IF NOT EXISTS platform_settings (
  id            INTEGER DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  name          TEXT    NOT NULL DEFAULT 'VGR Academy',
  tagline       TEXT    DEFAULT 'Sua Plataforma de Cursos',
  primary_color TEXT    DEFAULT '#e50914',
  logo_text     TEXT    DEFAULT 'VGR',
  logo_span     TEXT    DEFAULT 'ACADEMY',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (id, name, tagline, primary_color, logo_text, logo_span)
VALUES (1, 'VGR Academy', 'Sua Plataforma de Cursos', '#e50914', 'VGR', 'ACADEMY')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
--  ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings  ENABLE ROW LEVEL SECURITY;

-- PROFILES: usuário lê/edita apenas o próprio perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin lê todos os perfis
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.plan = 'admin')
  );

-- COURSES: todos leem cursos ativos; admin faz tudo
CREATE POLICY "courses_select_active" ON courses
  FOR SELECT USING (
    active = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
  );

CREATE POLICY "courses_admin_all" ON courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
  );

-- USER PROGRESS: apenas o próprio usuário
CREATE POLICY "progress_own_select" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_own_insert" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_own_update" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- COMMENTS: todos leem (exceto deletados); usuário insere o próprio; admin gerencia tudo
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (status != 'deleted');

CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_admin_all" ON comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
  );

-- PLATFORM SETTINGS: todos leem; admin escreve
CREATE POLICY "settings_select_all" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "settings_admin_all" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
  );

-- =====================================================
--  TRIGGER: criar perfil automaticamente ao cadastrar
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name   TEXT;
  v_avatar TEXT;
BEGIN
  v_name   := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_avatar := 'https://ui-avatars.com/api/?name='
              || replace(v_name, ' ', '+')
              || '&background=e50914&color=fff&size=80';

  INSERT INTO public.profiles (id, name, avatar, plan)
  VALUES (NEW.id, v_name, v_avatar, 'free')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
--  MIGRATION: colunas adicionais para hero, landing e featured
--  Execute este bloco após o schema inicial
-- =====================================================

-- Hero no painel principal (home)
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_type              TEXT    DEFAULT 'video';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_url               TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_poster            TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_badge             TEXT    DEFAULT 'Em Destaque';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_title_1           TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_title_2           TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_title_highlight   BOOLEAN DEFAULT TRUE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_description       TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS hero_featured_course_id INTEGER;

-- Vídeo da landing page
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS landing_video_type    TEXT    DEFAULT 'video';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS landing_video_url     TEXT    DEFAULT '';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS landing_video_poster  TEXT    DEFAULT '';

-- Lista ordenada de IDs em destaque
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS featured_ids JSONB DEFAULT '[]';

-- Flag de destaque nos cursos
ALTER TABLE courses ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Trilhas de aprendizado
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS trails JSONB DEFAULT '[]';

-- Plano mínimo necessário para acessar o curso
ALTER TABLE courses ADD COLUMN IF NOT EXISTS plan_required TEXT DEFAULT 'free'
  CHECK (plan_required IN ('free', 'premium'));

-- Link e detalhes do curso
ALTER TABLE courses ADD COLUMN IF NOT EXISTS watch_url TEXT DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS details   TEXT DEFAULT '';

-- Promover conta para admin (substitua o e-mail)
-- UPDATE profiles SET plan = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'SEU-EMAIL@aqui.com');
