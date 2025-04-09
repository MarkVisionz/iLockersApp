import { useState } from 'react';
import { validateEmail, validatePassword } from '../../../features/validators';

export const useLoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    form: ""
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // ✅ Validación de campo único
  const validateField = (name, value) => {
    let error = "";

    if (name === "email") {
      if (!value.trim()) error = "El correo es requerido";
      else if (!validateEmail(value)) error = "Correo inválido";
    }

    if (name === "password") {
      if (!value) error = "La contraseña es requerida";
      else if (value.length < 6) error = "Mínimo 6 caracteres";
      else if (value.length > 50) error = "Máximo 50 caracteres";
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  // ✅ Validación completa
  const validateForm = () => {
    const validEmail = validateField("email", formData.email);
    const validPass = validateField("password", formData.password);
    return validEmail && validPass;
  };

  // ✅ Cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Resetear errores si ya fue tocado o si hay error general
    if (touched[name]) validateField(name, value);
    if (errors.form) setErrors(prev => ({ ...prev, form: "" }));
  };

  // ✅ On blur (pierde foco)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // ✅ Errores del backend
  const handleBackendError = (error) => {
    const res = error?.response?.data;
    const msg = res?.message;

    // Errores validados por Joi
    if (Array.isArray(res?.errors)) {
      res.errors.forEach(err => {
        setErrors(prev => ({ ...prev, [err.field]: err.message }));
      });
      return;
    }

    // Bloqueos o límites de intento
    if (msg?.includes("bloqueada")) {
      setErrors(prev => ({ ...prev, form: msg }));
      return;
    }

    if (res?.remainingAttempts !== undefined) {
      setRemainingAttempts(res.remainingAttempts);
      setErrors(prev => ({
        ...prev,
        password: "Contraseña incorrecta",
        form: msg || "Intento fallido"
      }));
      return;
    }

    if (msg?.includes("Credenciales inválidas")) {
      setErrors(prev => ({
        ...prev,
        password: "Contraseña incorrecta",
        form: "Correo o contraseña incorrectos"
      }));
      return;
    }

    // Error genérico
    setErrors(prev => ({
      ...prev,
      form: msg || "Error de conexión con el servidor"
    }));
  };

  // ✅ Reset del formulario
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
