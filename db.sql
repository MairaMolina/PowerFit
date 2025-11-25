-- 1. CREAR LA TABLA (Con todos los campos de una vez)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  apellido text,
  genero text,
  fecha_nacimiento date,
  -- Nuevos campos fitness
  peso numeric,
  altura numeric,
  objetivos jsonb,
  nivel_actividad text,
  preferencias_ejercicio jsonb,
  dieta_saludable boolean,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. ACTIVAR SEGURIDAD (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS DE ACCESO (Borramos las viejas por si acaso para evitar errores)
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON public.perfiles FOR SELECT USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON public.perfiles FOR UPDATE USING ( auth.uid() = id );

DROP POLICY IF EXISTS "El sistema puede crear perfiles" ON public.perfiles;
CREATE POLICY "El sistema puede crear perfiles" 
ON public.perfiles FOR INSERT WITH CHECK ( auth.uid() = id );

-- 4. ACTUALIZAR EL CEREBRO DEL ROBOT (La función)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (
    id, 
    nombre, 
    apellido, 
    genero, 
    fecha_nacimiento,
    peso,
    altura,
    objetivos,
    nivel_actividad,
    preferencias_ejercicio,
    dieta_saludable
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    new.raw_user_meta_data->>'genero',
    (new.raw_user_meta_data->>'fecha_nacimiento')::date,
    
    -- Mapeo seguro de números (evita error si vienen vacíos)
    CASE WHEN new.raw_user_meta_data->>'peso' = '' THEN NULL 
         ELSE (new.raw_user_meta_data->>'peso')::numeric END,
         
    CASE WHEN new.raw_user_meta_data->>'altura' = '' THEN NULL 
         ELSE (new.raw_user_meta_data->>'altura')::numeric END,
         
    (new.raw_user_meta_data->'objetivos'), 
    new.raw_user_meta_data->>'nivel_actividad',
    (new.raw_user_meta_data->'preferencias_ejercicio'), 
    (new.raw_user_meta_data->>'dieta_saludable')::boolean
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REINICIAR EL GATILLO (TRIGGER)
-- Borramos el trigger viejo si existe para evitar conflictos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Creamos el nuevo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();