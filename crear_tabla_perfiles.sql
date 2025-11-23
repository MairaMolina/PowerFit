-- Script SQL para crear la tabla perfiles_usuario en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS perfiles_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    telefono VARCHAR(20),
    peso DECIMAL(5,2), -- peso en kg (ej: 70.50)
    altura DECIMAL(5,2), -- altura en cm (ej: 175.50)
    objetivos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_perfiles_usuario_usuario_id ON perfiles_usuario(usuario_id);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfiles_usuario_updated_at
    BEFORE UPDATE ON perfiles_usuario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();