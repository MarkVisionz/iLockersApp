import { useState } from 'react';
import { validateEmail, validatePassword } from '../../../features/validators';


export const useLoginForm = () => {
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "" 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    form: ""
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  // Validación por campo
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "email":
        if (!value.trim()) {
          error = "El correo es requerido";
        } else if (!validateEmail(value)) {
          error = "Por favor ingrese un correo válido";
        }
        break;
      case "password":
        if (!value) {
          error = "La contraseña es requerida";
        } else if (value.length < 6) {
          error = "La contraseña debe tener al menos 6 caracteres";
        } else if (value.length > 50) {
          error = "La contraseña no debe exceder 50 caracteres";
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validación del formulario completo
  const validateForm = () => {
    const emailOk = validateField('email', formData.email);
    const passwordOk = validateField('password', formData.password);
    return emailOk && passwordOk;
  };

  // Cambio en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) validateField(name, value);
    if (errors.form) setErrors(prev => ({ ...prev, form: "" }));
  };

  // Cuando pierde el foco
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleBackendError = (error) => {
    const { response } = error;
  
    // Errores de validación desde Joi
    if (response?.data?.errors?.length > 0) {
      const backendErrors = response.data.errors;
      backendErrors.forEach(err => {
        setErrors(prev => ({ ...prev, [err.field]: err.message }));
      });
      return;
    }
  
    if (response?.data?.message) {
      const message = response.data.message;
  
      if (message.includes("temporalmente bloqueada")) {
        setErrors(prev => ({ ...prev, form: message }));
        return;
      }
  
      if (response.data.remainingAttempts !== undefined) {
        setRemainingAttempts(response.data.remainingAttempts);
        setErrors(prev => ({ 
          ...prev, 
          password: "Contraseña incorrecta",
          form: message 
        }));
        return;
      }
  
      if (message.includes("Credenciales inválidas")) {
        setErrors(prev => ({ 
          ...prev, 
          form: "Correo o contraseña incorrectos",
          password: "Contraseña incorrecta"
        }));
        return;
      }
  
      // Otro mensaje desconocido
      setErrors(prev => ({ ...prev, form: message }));
    } else {
      // No hay respuesta del servidor (por ejemplo: desconectado)
      setErrors(prev => ({
        ...prev,
        form: "Error de conexión con el servidor"
      }));
    }
  };
  

  // Reset del formulario
  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setErrors({ email: "", password: "", form: "" });
    setTouched({ email: false, password: false });
    setRemainingAttempts(null);
  };

  return {
    formData,
    errors,
    touched,
    showPassword,
    isSubmitting,
    remainingAttempts,
    setShowPassword,
    handleInputChange,
    handleBlur,
    validateForm,
    handleBackendError,
    setIsSubmitting,
    resetForm,
    setFormData
  };
};
