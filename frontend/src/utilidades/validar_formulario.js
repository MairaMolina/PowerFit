// src/utilidades/validar_formulario.js

/**
 * Valida el correo electrónico.
   @param {string} correo - El correo a validar.
   @returns {boolean} - true si es válido, false si no.
 */
export function validarCorreo(correo) {
  // Una regex (expresion regular) para validación
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

/**
 * se revisa la contraseña segun los requisitos del RF 1.7
 * @param {string} contrasena - La contraseña a revisar
 * @returns {object} objeto con los requisitos y un booleano 'esValida'.
 */
export function validarRequisitosContrasena(contrasena) {
  const requisitos = {
    // RF 1.7: Mínimo 10 caracteres 
    longitud: contrasena.length >= 10,
    // RF 1.7: Al menos una mayúscula 
    mayuscula: /[A-Z]/.test(contrasena),
    // alfanumérica
    minuscula: /[a-z]/.test(contrasena),
    // RF 1.7: Al menos un número
    numero: /[0-9]/.test(contrasena),
    // RF 1.7: Al menos un carácter especial (!, @, #, $)
    especial: /[!@#\$]/.test(contrasena) 
  };
  
  // Verifica que todos los valores sean 'true'
  const esValida = Object.values(requisitos).every(Boolean);
  
  return { esValida, requisitos };
}