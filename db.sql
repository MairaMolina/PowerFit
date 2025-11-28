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

-- ============================================
-- ESQUEMA DE OBJETIVOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.objetivos_seguimiento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de objetivo
  tipo_objetivo text NOT NULL CHECK (tipo_objetivo IN ('meta_peso', 'frecuencia_semanal', 'meta_fuerza')),
  
  -- Valores de seguimiento
  meta_valor numeric NOT NULL,           -- Valor objetivo final (ej: 75 kg, 5 veces/semana)
  valor_inicio numeric,                  -- Valor al comenzar (ej: peso inicial)
  valor_actual numeric DEFAULT 0,        -- Valor actual (se actualiza con el progreso)
  
  -- Configuración del objetivo
  es_recurrente boolean DEFAULT false,   -- Si es semanal recurrente o meta única
  frecuencia_semanal integer,            -- Para objetivos recurrentes (ej: 3 veces/semana)
  fecha_limite date,                     -- Fecha límite opcional
  
  -- Estado y progreso
  estado text DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'completado', 'cancelado')),
  progreso_porcentaje integer DEFAULT 0, -- Calculado (0-100)
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  fecha_completado timestamp with time zone
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_objetivos_user_id ON public.objetivos_seguimiento(user_id);
CREATE INDEX idx_objetivos_estado ON public.objetivos_seguimiento(estado);
CREATE INDEX idx_objetivos_fecha_limite ON public.objetivos_seguimiento(fecha_limite);

-- Habilitar RLS para objetivos
ALTER TABLE public.objetivos_seguimiento ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para objetivos_seguimiento
DROP POLICY IF EXISTS "usuarios_ver_propios_objetivos" ON public.objetivos_seguimiento;
CREATE POLICY "usuarios_ver_propios_objetivos" 
ON public.objetivos_seguimiento FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_crear_objetivos" ON public.objetivos_seguimiento;
CREATE POLICY "usuarios_crear_objetivos" 
ON public.objetivos_seguimiento FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_actualizar_objetivos" ON public.objetivos_seguimiento;
CREATE POLICY "usuarios_actualizar_objetivos" 
ON public.objetivos_seguimiento FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_eliminar_objetivos" ON public.objetivos_seguimiento;
CREATE POLICY "usuarios_eliminar_objetivos" 
ON public.objetivos_seguimiento FOR DELETE 
USING (auth.uid() = user_id);

-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para objetivos_seguimiento
DROP TRIGGER IF EXISTS update_objetivos_seguimiento_updated_at ON public.objetivos_seguimiento;
CREATE TRIGGER update_objetivos_seguimiento_updated_at
    BEFORE UPDATE ON public.objetivos_seguimiento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ESQUEMA DE RUTINAS
-- ============================================

-- Tabla principal de rutinas
CREATE TABLE IF NOT EXISTS public.rutinas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica
  nombre text NOT NULL,
  descripcion text,
  categoria text CHECK (categoria IN ('fuerza', 'cardio', 'yoga', 'hiit', 'funcional', 'otro')),
  
  -- Detalles de la rutina
  duracion_minutos integer NOT NULL,           -- Duración en minutos (45, 30, etc.)
  numero_ejercicios integer DEFAULT 0,         -- Cantidad de ejercicios
  nivel text CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')),
  calorias_estimadas integer,                  -- Calorías quemadas estimadas
  
  -- Estado
  es_favorita boolean DEFAULT false,
  veces_completada integer DEFAULT 0,          -- Contador de veces completada
  
  -- Relación con objetivos (opcional, para sugerencias automáticas)
  contribuye_a jsonb,                          -- Array de tipos de objetivos: ['meta_peso', 'meta_fuerza']
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ultima_vez_realizada timestamp with time zone
);

-- Índices para rutinas
CREATE INDEX idx_rutinas_user_id ON public.rutinas(user_id);
CREATE INDEX idx_rutinas_categoria ON public.rutinas(categoria);
CREATE INDEX idx_rutinas_favorita ON public.rutinas(es_favorita);

-- Ejercicios específicos de cada rutina
CREATE TABLE IF NOT EXISTS public.ejercicios_rutina (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rutina_id uuid NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
  
  -- Información del ejercicio
  nombre text NOT NULL,
  descripcion text,
  orden integer NOT NULL,                      -- Orden del ejercicio en la rutina
  
  -- Configuración
  series integer,
  repeticiones integer,
  duracion_segundos integer,                   -- Para ejercicios de tiempo (plancha, etc.)
  peso_sugerido numeric,                       -- Peso sugerido en kg
  descanso_segundos integer DEFAULT 60,
  
  -- Multimedia
  video_url text,
  imagen_url text,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para ejercicios_rutina
CREATE INDEX idx_ejercicios_rutina_id ON public.ejercicios_rutina(rutina_id);
CREATE INDEX idx_ejercicios_orden ON public.ejercicios_rutina(rutina_id, orden);

-- Registro de cada vez que el usuario completa una rutina
CREATE TABLE IF NOT EXISTS public.historial_rutinas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rutina_id uuid NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
  
  -- Datos de la sesión
  fecha_completada timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  duracion_real_minutos integer,               -- Duración real vs estimada
  calorias_quemadas integer,
  
  -- Intensidad percibida (1-10)
  intensidad_percibida integer CHECK (intensidad_percibida BETWEEN 1 AND 10),
  
  -- Notas del usuario
  notas text,
  
  -- Relación con objetivos (actualiza progreso automáticamente)
  contribuye_objetivo_id uuid REFERENCES public.objetivos_seguimiento(id) ON DELETE SET NULL,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para historial_rutinas
CREATE INDEX idx_historial_user_id ON public.historial_rutinas(user_id);
CREATE INDEX idx_historial_rutina_id ON public.historial_rutinas(rutina_id);
CREATE INDEX idx_historial_fecha ON public.historial_rutinas(fecha_completada DESC);
CREATE INDEX idx_historial_objetivo ON public.historial_rutinas(contribuye_objetivo_id);

-- Relaciona qué rutinas contribuyen a qué objetivos
CREATE TABLE IF NOT EXISTS public.rutinas_objetivos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  rutina_id uuid NOT NULL REFERENCES public.rutinas(id) ON DELETE CASCADE,
  objetivo_id uuid NOT NULL REFERENCES public.objetivos_seguimiento(id) ON DELETE CASCADE,
  
  -- Peso de contribución (1-100%) - qué tanto esta rutina ayuda al objetivo
  peso_contribucion integer DEFAULT 100 CHECK (peso_contribucion BETWEEN 1 AND 100),
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Evitar duplicados
  UNIQUE(rutina_id, objetivo_id)
);

-- Índices para rutinas_objetivos
CREATE INDEX idx_rutinas_objetivos_rutina ON public.rutinas_objetivos(rutina_id);
CREATE INDEX idx_rutinas_objetivos_objetivo ON public.rutinas_objetivos(objetivo_id);

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS) PARA RUTINAS
-- ============================================

-- RUTINAS
ALTER TABLE public.rutinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_ver_propias_rutinas" ON public.rutinas;
CREATE POLICY "usuarios_ver_propias_rutinas" 
ON public.rutinas FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_crear_rutinas" ON public.rutinas;
CREATE POLICY "usuarios_crear_rutinas" 
ON public.rutinas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_actualizar_rutinas" ON public.rutinas;
CREATE POLICY "usuarios_actualizar_rutinas" 
ON public.rutinas FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_eliminar_rutinas" ON public.rutinas;
CREATE POLICY "usuarios_eliminar_rutinas" 
ON public.rutinas FOR DELETE 
USING (auth.uid() = user_id);

-- EJERCICIOS_RUTINA
ALTER TABLE public.ejercicios_rutina ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_ver_ejercicios_de_sus_rutinas" ON public.ejercicios_rutina;
CREATE POLICY "usuarios_ver_ejercicios_de_sus_rutinas" 
ON public.ejercicios_rutina FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = ejercicios_rutina.rutina_id 
  AND rutinas.user_id = auth.uid()
));

DROP POLICY IF EXISTS "usuarios_crear_ejercicios_en_sus_rutinas" ON public.ejercicios_rutina;
CREATE POLICY "usuarios_crear_ejercicios_en_sus_rutinas" 
ON public.ejercicios_rutina FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = ejercicios_rutina.rutina_id 
  AND rutinas.user_id = auth.uid()
));

DROP POLICY IF EXISTS "usuarios_actualizar_ejercicios_de_sus_rutinas" ON public.ejercicios_rutina;
CREATE POLICY "usuarios_actualizar_ejercicios_de_sus_rutinas" 
ON public.ejercicios_rutina FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = ejercicios_rutina.rutina_id 
  AND rutinas.user_id = auth.uid()
));

DROP POLICY IF EXISTS "usuarios_eliminar_ejercicios_de_sus_rutinas" ON public.ejercicios_rutina;
CREATE POLICY "usuarios_eliminar_ejercicios_de_sus_rutinas" 
ON public.ejercicios_rutina FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = ejercicios_rutina.rutina_id 
  AND rutinas.user_id = auth.uid()
));

-- HISTORIAL_RUTINAS
ALTER TABLE public.historial_rutinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_ver_propio_historial_rutinas" ON public.historial_rutinas;
CREATE POLICY "usuarios_ver_propio_historial_rutinas" 
ON public.historial_rutinas FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios_crear_historial_rutinas" ON public.historial_rutinas;
CREATE POLICY "usuarios_crear_historial_rutinas" 
ON public.historial_rutinas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RUTINAS_OBJETIVOS
ALTER TABLE public.rutinas_objetivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_ver_relaciones_rutinas_objetivos" ON public.rutinas_objetivos;
CREATE POLICY "usuarios_ver_relaciones_rutinas_objetivos" 
ON public.rutinas_objetivos FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = rutinas_objetivos.rutina_id 
  AND rutinas.user_id = auth.uid()
));

DROP POLICY IF EXISTS "usuarios_crear_relaciones_rutinas_objetivos" ON public.rutinas_objetivos;
CREATE POLICY "usuarios_crear_relaciones_rutinas_objetivos" 
ON public.rutinas_objetivos FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = rutinas_objetivos.rutina_id 
  AND rutinas.user_id = auth.uid()
));

DROP POLICY IF EXISTS "usuarios_eliminar_relaciones_rutinas_objetivos" ON public.rutinas_objetivos;
CREATE POLICY "usuarios_eliminar_relaciones_rutinas_objetivos" 
ON public.rutinas_objetivos FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.rutinas 
  WHERE rutinas.id = rutinas_objetivos.rutina_id 
  AND rutinas.user_id = auth.uid()
));

-- ============================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ============================================

-- Trigger para actualizar updated_at en rutinas
DROP TRIGGER IF EXISTS update_rutinas_updated_at ON public.rutinas;
CREATE TRIGGER update_rutinas_updated_at
    BEFORE UPDATE ON public.rutinas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar contador de veces completada
CREATE OR REPLACE FUNCTION actualizar_contador_rutina()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.rutinas
    SET 
        veces_completada = veces_completada + 1,
        ultima_vez_realizada = NEW.fecha_completada
    WHERE id = NEW.rutina_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_contador_rutina ON public.historial_rutinas;
CREATE TRIGGER trigger_actualizar_contador_rutina
    AFTER INSERT ON public.historial_rutinas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_contador_rutina();

-- Función que actualiza el progreso de objetivos al completar rutinas
CREATE OR REPLACE FUNCTION actualizar_progreso_objetivo_con_rutina()
RETURNS TRIGGER AS $$
DECLARE
    objetivo_record RECORD;
BEGIN
    -- Si la rutina está vinculada a un objetivo de frecuencia semanal
    IF NEW.contribuye_objetivo_id IS NOT NULL THEN
        SELECT * INTO objetivo_record 
        FROM public.objetivos_seguimiento 
        WHERE id = NEW.contribuye_objetivo_id;
        
        -- Solo actualizar objetivos de frecuencia semanal
        IF objetivo_record.tipo_objetivo = 'frecuencia_semanal' THEN
            -- Contar rutinas completadas esta semana
            UPDATE public.objetivos_seguimiento
            SET valor_actual = (
                SELECT COUNT(*) 
                FROM public.historial_rutinas 
                WHERE contribuye_objetivo_id = NEW.contribuye_objetivo_id
                AND fecha_completada >= date_trunc('week', CURRENT_DATE)
            )
            WHERE id = NEW.contribuye_objetivo_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_progreso_objetivo ON public.historial_rutinas;
CREATE TRIGGER trigger_actualizar_progreso_objetivo
    AFTER INSERT ON public.historial_rutinas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_progreso_objetivo_con_rutina();