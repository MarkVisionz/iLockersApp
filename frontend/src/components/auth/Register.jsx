// src/components/Auth/Register.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRegisterForm } from "./Hooks/useRegisterForm";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import styled from "styled-components";
import { FiEye, FiEyeOff } from "react-icons/fi";
import {
  BackgroundWrapper,
  PageWrapper,
  WelcomeText,
  Form,
  FormGroup,
  ButtonLogin,
  SignupPrompt,
  PasswordWrapper,
  TogglePasswordButton,
} from "./StyledForm";

import { LoginBackground } from "../LoginBackground";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    formData,
    errors,
    touched,
    isSubmitting,
    showPassword,
    setShowPassword,
    setIsSubmitting,
    handleInputChange,
    handleBlur,
    validateForm,
    handleBackendError,
    resetForm,
  } = useRegisterForm();

  useEffect(() => {
    if (auth._id) {
      navigate("/cart");
    } else {
      const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeRegister");
      if (hasSeenWelcome) {
        setShowForm(true);
      } else {
        const timer = setTimeout(() => {
          setShowForm(true);
          localStorage.setItem("hasSeenWelcomeRegister", "true");
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [auth._id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await dispatch(registerUser(formData)).unwrap();
      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        navigate("/cart");
      }, 1500);
    } catch (error) {
      handleBackendError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== "form" && errors[key]
  );

  return (
    <LoginBackground>
      <BackgroundWrapper>
        <PageWrapper>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Form
                onSubmit={handleSubmit}
                className={errors.form || hasFieldErrors ? "shake" : ""}
                aria-label="Formulario de registro"
              >
                <h2>Regístrate</h2>

                {errors.form && <ErrorMessage message={errors.form} />}

                <FormGroup>
                  <label htmlFor="name">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Nombre completo"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && (
                    <ErrorMessage id="name-error" message={errors.name} />
                  )}
                </FormGroup>

                <FormGroup>
                  <label htmlFor="email">Correo</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Correo electrónico"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <ErrorMessage id="email-error" message={errors.email} />
                  )}
                </FormGroup>

                <FormGroup>
                  <label htmlFor="password">Contraseña</label>
                  <PasswordWrapper>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Contraseña segura"
                      aria-required="true"
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                    />
                    <TogglePasswordButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </TogglePasswordButton>
                  </PasswordWrapper>
                  {errors.password && (
                    <ErrorMessage
                      id="password-error"
                      message={errors.password}
                    />
                  )}
                </FormGroup>

                <FormGroup>
                  <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <PasswordWrapper>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Repite tu contraseña"
                      aria-required="true"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                    />
                    <TogglePasswordButton
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </TogglePasswordButton>
                  </PasswordWrapper>
                  {errors.confirmPassword && (
                    <ErrorMessage
                      id="confirmPassword-error"
                      message={errors.confirmPassword}
                    />
                  )}
                </FormGroup>

                <ButtonLogin disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoadingSpinner message="Registrando..." />
                  ) : (
                    "Crear cuenta"
                  )}
                </ButtonLogin>

                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p style={{ color: "green" }}>¡Registro exitoso!</p>
                  </motion.div>
                )}

                <SignupPrompt>
                  ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                </SignupPrompt>
              </Form>
            </motion.div>
          )}
        </PageWrapper>
      </BackgroundWrapper>
    </LoginBackground>
  );
};

export default Register;
