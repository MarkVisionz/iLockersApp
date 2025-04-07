// src/components/Auth/Hooks/useFirebaseRegisterForm.jsx
import { useState } from 'react';
import { validateEmail, validatePassword } from '../../../features/validators';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../../features/firebase-config';
import axios from 'axios';

export const useFirebaseRegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(""); // ✅ Nuevo

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    form: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
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
    return isNameValid && isEmailValid && isPasswordValid;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const currentUser = userCredential.user;
  
      await sendEmailVerification(currentUser);
  
      setVerificationEmail(currentUser.email); // <- esto activa el cambio de vista
      resetForm();
    } catch (error) {
      handleBackendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleBackendError = (error) => {
    if (error.response?.data?.errors) {
      error.response.data.errors.forEach(err => {
        setErrors(prev => ({ ...prev, [err.field]: err.message }));
      });
    } else if (error.response?.data?.message) {
      setErrors(prev => ({ ...prev, form: error.response.data.message }));
    } else if (error.code && error.message) {
      let message = "Ocurrió un error";

      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Este correo ya está registrado.";
          setErrors(prev => ({ ...prev, email: message }));
          break;
        case "auth/invalid-email":
          message = "El correo no es válido.";
          setErrors(prev => ({ ...prev, email: message }));
          break;
        case "auth/weak-password":
          message = "La contraseña es muy débil.";
          setErrors(prev => ({ ...prev, password: message }));
          break;
        default:
          setErrors(prev => ({ ...prev, form: error.message }));
          break;
      }
    } else {
      setErrors(prev => ({
        ...prev,
        form: "Error de conexión con el servidor",
      }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setErrors({ name: '', email: '', password: '', form: '' });
    setTouched({ name: false, email: false, password: false });
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
    handleSubmit,
    verificationEmail, // ✅ clave para mostrar EmailVerification.jsx
  };
};
