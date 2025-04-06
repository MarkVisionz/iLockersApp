// src/utils/validators.js

/**
 * Valida un email con expresión regular
 * @param {string} email - Email a validar
 * @returns {boolean} - True si el email es válido
 */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  
  /**
   * Valida una contraseña (mínimo 6 caracteres)
   * @param {string} password - Contraseña a validar
   * @returns {boolean} - True si la contraseña es válida
   */
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  /**
   * Valida un formulario completo
   * @param {object} fields - Campos del formulario
   * @returns {object} - Objeto con errores {field: error}
   */
  export const validateForm = (fields) => {
    const errors = {};
    
    if (!fields.email) {
      errors.email = "Email es requerido";
    } else if (!validateEmail(fields.email)) {
      errors.email = "Email inválido";
    }
    
    if (!fields.password) {
      errors.password = "Contraseña es requerida";
    } else if (!validatePassword(fields.password)) {
      errors.password = "Mínimo 6 caracteres";
    }
    
    return errors;
  };
  
  // Opcional: Validación para formulario de registro
  export const validateRegisterForm = (fields) => {
    const errors = validateForm(fields);
    
    if (!fields.name) {
      errors.name = "Nombre es requerido";
    }
    
    return errors;
  };