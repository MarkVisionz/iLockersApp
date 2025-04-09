// src/components/Auth/Register.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFirebaseRegisterForm } from "./Hooks/useFirebaseRegisterForm";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import styled from "styled-components";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useSelector } from "react-redux";

import {
  BackgroundWrapper,
  PageWrapper,
  Form,
  FormGroup,
  ButtonLogin,
  SignupPrompt,
  PasswordWrapper,
  TogglePasswordButton,
} from "./StyledForm";

import { LoginBackground } from "../LoginBackground";
import GoogleLoginButton from "./GoogleLoginButton";
import AppleLoginButton from "./AppleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";

const Register = () => {
  const navigate = useNavigate();
  const verificationEmail = useSelector((state) => state.auth.verificationEmail);

  const {
    formData,
    errors,
    touched,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleInputChange,
    handleBlur,
    handleSubmit,
  } = useFirebaseRegisterForm();

  useEffect(() => {
    if (verificationEmail) {
      navigate("/verify-email");
    }
  }, [verificationEmail, navigate]);

  const hasFieldErrors = Object.keys(errors).some(
    (key) => key !== "form" && errors[key]
  );

  return (
    <LoginBackground>
      <BackgroundWrapper>
        <PageWrapper>
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
              <Title>Crear cuenta</Title>
              <Subtitle>
                Regístrate para comenzar con Easy Laundry
              </Subtitle>

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
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

              <ButtonLogin disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <LoadingSpinner message="Registrando..." />
                ) : (
                  "Crear cuenta"
                )}
              </ButtonLogin>

              {errors.form && <ErrorMessage message={errors.form} />}

              <Divider>o continúa con </Divider>

              <GoogleLoginButton />
              <FacebookLoginButton />
              <AppleLoginButton />

              <SignupPrompt>
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login">Inicia sesión</Link>
              </SignupPrompt>
            </Form>
          </motion.div>
        </PageWrapper>
      </BackgroundWrapper>
    </LoginBackground>
  );
};

export default Register;

// Estilos locales
const Title = styled.h2`
  font-size: 1.6rem;
  text-align: center;
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 0.95rem;
  color: #888;
`;

const Divider = styled.div`
  text-align: center;
  color: #aaa;
  font-size: 0.85rem;
  position: relative;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: #ddd;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
`;
