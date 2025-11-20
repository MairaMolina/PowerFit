import express from 'express';
import cors from 'cors';
import path from 'path';
import rutasUsuario from './rutas/usuarios.js';

// Crear la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000; // Puerto para el backend

// === Middlewares ===
// 1. CORS: Permite que el frontend hable con el backend en el puerto 3000
app.use(cors());

// 2. JSON: Permite que Express entienda el JSON que el frontend enviará en el 'body'
app.use(express.json());

// 3. Static: Servir archivos estáticos del frontend
const publicPath = path.join(process.cwd(), 'frontend/public');
const srcPath = path.join(process.cwd(), 'frontend/src');
console.log('Public path:', publicPath);
console.log('Src path:', srcPath);
app.use('/src', express.static(srcPath));
app.use(express.static(publicPath));

// === Rutas ===
// Ruta raíz - redirige a inicio.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'inicio.html'));
});

// Ruta específica para cambiar-contrasena  
app.get('/cambiar_contrasena', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend/public/cambiar_contrasena.html'));
});

// Le decimos a Express que use nuestras rutas de usuario y que todas empiecen con '/api'
app.use('/api', rutasUsuario);

// === Manejo de errores 404 (AGREGAR ESTO) ===
app.use((req, res) => {
  console.log('❌ 404 - Ruta no encontrada:', req.url);
  res.status(404).send(`
    <h1>404 - Página no encontrada</h1>
    <p>La ruta <code>${req.url}</code> no existe.</p>
    <a href="/">Ir al inicio</a>
  `);
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de POWERFIT corriendo en http://localhost:${PORT}`);
});
