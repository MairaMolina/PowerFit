import express from 'express';
// 1. Importa la nueva función
import { registrarUsuario, iniciarSesion, solicitarResetPassword, listarUsuarios, cambiarContrasenaPorEmail } from '../controladores/usuario_controlador.js';

const router = express.Router();

// Ruta de Registro (ya la tienes)
router.post('/registro', registrarUsuario);
// 2 RUTA DE LOGIN
router.post('/login', iniciarSesion);
// Ruta de Reset Password
router.post('/reset-password', solicitarResetPassword);
// Ruta para listar usuarios (solo para testing)
router.get('/usuarios', listarUsuarios);
// Ruta para cambiar contraseña por email (solo para testing)
router.post('/cambiar-contrasena', cambiarContrasenaPorEmail);

export default router;