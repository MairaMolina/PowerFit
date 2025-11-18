import express from 'express';
// 1. Importa la nueva función
import { registrarUsuario, iniciarSesion } from '../controladores/usuario_controlador.js';

const router = express.Router();

// Ruta de Registro (ya la tienes)
router.post('/registro', registrarUsuario);
// 2 RUTA DE LOGIN 
router.post('/login', iniciarSesion);

export default router;