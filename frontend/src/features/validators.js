// src/utils/validators.js

/**
 * Valida un email con expresión regular
 * @param {string} email - Email a validar
 * @returns {boolean} - True si el email es válido
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase().trim());
};

/**
 * Valida una contraseña (mínimo 6 caracteres y al menos un número)
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - True si la contraseña es válida
 */
export const validatePassword = (password) => {
  const re = /^(?=.*\d).{6,}$/; // Mínimo 6 caracteres, al menos un número
  return re.test(password.trim());
};

/**
 * Valida un formulario básico de login
 * @param {object} fields - Campos del formulario
 * @returns {object} - Objeto con errores { field: error }
 */
export const validateForm = (fields) => {
  const errors = {};
  const email = fields.email?.trim() || '';
  const password = fields.password?.trim() || '';

  if (!email) {
    errors.email = "Email es requerido";
  } else if (!validateEmail(email)) {
    errors.email = "Email inválido";
  }

  if (!password) {
    errors.password = "Contraseña es requerida";
  } else if (!validatePassword(password)) {
    errors.password = "Mínimo 6 caracteres y al menos un número";
  }

  return errors;
};

/**
 * Valida un formulario de registro
 * @param {object} fields - Campos del formulario
 * @returns {object} - Objeto con errores { field: error }
 */
export const validateRegisterForm = (fields) => {
  const errors = validateForm(fields);
  const name = fields.name?.trim() || '';

  if (!name) {
    errors.name = "Nombre es requerido";
  } else if (name.length < 3) {
    errors.name = "Nombre debe tener al menos 3 caracteres";
  }

  return errors;
};

/**
 * Valida que la confirmación de contraseña coincida
 * @param {string} password - Contraseña original
 * @param {string} confirmPassword - Confirmación
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return "La confirmación es requerida";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden";
  }
  return null;
};

