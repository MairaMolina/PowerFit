import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== LISTENER PARA GUARDAR SESIÓN EN LOCALSTORAGE ======
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth state change:', event, session ? 'session exists' : 'no session');
    if (session) {
        // Guardar la sesión en localStorage para que otras páginas puedan acceder
        localStorage.setItem('supabase.session', JSON.stringify(session));
        console.log('Session saved to localStorage');
    } else {
        // Limpiar localStorage cuando no hay sesión
        localStorage.removeItem('supabase.session');
        console.log('Session removed from localStorage');
    }
});
