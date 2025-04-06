// src/components/Auth/Hooks/useRegisterForm.jsx
import { useState } from 'react';
import { validateEmail, validatePassword } from '../../../features/validators';

export const useRegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // Nuevo campo
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // Nuevo campo en errors
    form: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false, // Nuevo campo en touched
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) error = 'El nombre es requerido';
        else if (value.length < 3) error = 'El nombre debe tener al menos 3 caracteres';
        break;
      case 'email':
        if (!value.trim()) error = 'El correo es requerido';
        else if (!validateEmail(value)) error = 'Correo inválido';
        break;
      case 'password':
        if (!value) error = 'La contraseña es requerida';
        else if (!validatePassword(value)) {
          error = 'Debe tener al menos 6 caracteres y un número';
        }
        break;
      case 'confirmPassword':
        if (!value) error = 'La confirmación es requerida';
        else if (value !== formData.password) error = 'Las contraseñas no coinciden';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', formData.confirmPassword);
    return isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) validateField(name, value);

    if (errors.form) {
      setErrors(prev => ({ ...prev, form: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleBackendError = (error) => {
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(err => {
        setErrors(prev => ({ ...prev, [err.field]: err.message }));
      });
    } else if (error.response?.data?.message) {
      setErrors(prev => ({ ...prev, form: error.response.data.message }));
    } else {
      setErrors(prev => ({ ...prev, form: 'Error de conexión con el servidor' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({ name: '', email: '', password: '', confirmPassword: '', form: '' });
    setTouched({ name: false, email: false, password: false, confirmPassword: false });
  };

  return {
    formData,
    errors,
    touched,
    showPassword,
    isSubmitting,
    setShowPassword,
    setIsSubmitting,
    handleInputChange,
    handleBlur,
    validateForm,
    handleBackendError,
    resetForm,
    setFormData,
  };
};