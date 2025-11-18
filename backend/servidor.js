import express from 'express';
import cors from 'cors';
import rutasUsuario from './rutas/usuarios.js';

// Crear la aplicación de Express
const app = express();
const PORT = process.env.PORT || 3000; // Puerto para el backend

// === Middlewares ===
// 1. CORS: Permite que el frontend hable con el backend en el puerto 3000
app.use(cors());

// 2. JSON: Permite que Express entienda el JSON que el frontend enviará en el 'body'
app.use(express.json());

// === Rutas ===
// Le decimos a Express que use nuestras rutas de usuario y que todas empiecen con '/api'
app.use('/api', rutasUsuario);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor de POWERFIT corriendo en http://localhost:${PORT}`);
});