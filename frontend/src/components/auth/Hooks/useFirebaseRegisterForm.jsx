import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '../../../features/firebase-config';
import { useDispatch } from 'react-redux';
import { setVerificationEmail as setEmailRedux } from '../../../features/authSlice';

// Validadores
const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) =>
  password.length >= 8 &&
  /[0-9]/.test(password) &&
  /[A-Z]/.test(password);

export const useFirebaseRegisterForm = () => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '', form: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'El nombre es requerido';
      else if (value.length < 3) error = 'Mínimo 3 caracteres';
    } else if (name === 'email') {
      if (!value.trim()) error = 'El correo es requerido';
      else if (!validateEmail(value)) error = 'Correo inválido';
    } else if (name === 'password') {
      if (!value) error = 'La contraseña es requerida';
      else if (!validatePassword(value)) {
        error = 'Mínimo 8 caracteres, 1 número y 1 mayúscula';
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () =>
    Object.keys(formData).every((field) => validateField(field, formData[field]));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
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

      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      await sendEmailVerification(userCredential.user);

      // Actualiza Redux y localStorage
      localStorage.setItem("pendingVerificationEmail", formData.email);
      dispatch(setEmailRedux(formData.email));

    } catch (error) {
      handleBackendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackendError = (error) => {
    const firebaseErrors = {
      'auth/email-already-in-use': { email: 'Este correo ya está registrado' },
      'auth/invalid-email': { email: 'Correo inválido' },
      'auth/weak-password': { password: 'La contraseña es muy débil' },
      'auth/network-request-failed': { form: 'Error de red. Verifica tu conexión' },
    };

    const mapped = firebaseErrors[error.code];
    if (mapped) {
      setErrors((prev) => ({ ...prev, ...mapped }));
    } else {
      setErrors((prev) => ({
        ...prev,
        form: error.message || "Error en el registro",
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
    handleInputChange,
    handleBlur,
    handleSubmit,
    setShowPassword,
    resetForm,
    validateForm,
    handleBackendError,
    setIsSubmitting
  };
};
