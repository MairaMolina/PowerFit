-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_completo text,
  correo text UNIQUE NOT NULL,
  genero text,
  telefono text,
  fecha_nacimiento date,
  peso numeric,
  altura numeric,
  objetivos text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla perfiles_usuario
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  telefono text,
  peso numeric,
  altura numeric,
  objetivos text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(usuario_id)
);

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
DROP POLICY IF EXISTS "usuarios_ver_propios" ON public.usuarios;
CREATE POLICY "usuarios_ver_propios"
ON public.usuarios FOR SELECT
USING (correo = auth.email());

DROP POLICY IF EXISTS "usuarios_crear" ON public.usuarios;
CREATE POLICY "usuarios_crear"
ON public.usuarios FOR INSERT
WITH CHECK (true);  -- Permitir durante el registro

DROP POLICY IF EXISTS "usuarios_actualizar" ON public.usuarios;
CREATE POLICY "usuarios_actualizar"
ON public.usuarios FOR UPDATE
USING (correo = auth.email());

-- Políticas para perfiles_usuario
DROP POLICY IF EXISTS "perfiles_ver_propios" ON public.perfiles_usuario;
CREATE POLICY "perfiles_ver_propios"
ON public.perfiles_usuario FOR SELECT
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = perfiles_usuario.usuario_id AND usuarios.correo = auth.email()));

DROP POLICY IF EXISTS "perfiles_crear" ON public.perfiles_usuario;
CREATE POLICY "perfiles_crear"
ON public.perfiles_usuario FOR INSERT
WITH CHECK (true);  -- Permitir durante el registro

DROP POLICY IF EXISTS "perfiles_actualizar" ON public.perfiles_usuario;
CREATE POLICY "perfiles_actualizar"
ON public.perfiles_usuario FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = perfiles_usuario.usuario_id AND usuarios.correo = auth.email()));

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_perfiles_usuario_updated_at ON public.perfiles_usuario;
CREATE TRIGGER update_perfiles_usuario_updated_at
    BEFORE UPDATE ON public.perfiles_usuario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();