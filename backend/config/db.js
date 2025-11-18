// backend/config/db.js

import { createClient } from '@supabase/supabase-js';

// Carga las variables de entorno (asegúrense de tener 'dotenv' instalado en su pc, asi: npm i dotenv)
import dotenv from 'dotenv';
dotenv.config(); // Apunta al .env en la raíz

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// conexión del backend
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Importante: deshabilita el auto-refresh en el servidor
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('Conectado a la base de datos');
