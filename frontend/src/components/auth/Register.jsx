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
              <Subtitle>Regístrate para comenzar con Easy Laundry</Subtitle>

              <FloatingInput>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder=" "
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={formData.name ? "filled" : ""}
                />
                <label htmlFor="name">Nombre completo</label>
                {errors.name && (
                  <ErrorMessage id="name-error" message={errors.name} />
                )}
              </FloatingInput>

              <FloatingInput>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder=" "
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={formData.email ? "filled" : ""}
                />
                <label htmlFor="email">Correo electrónico</label>
                {errors.email && (
                  <ErrorMessage id="email-error" message={errors.email} />
                )}
              </FloatingInput>

              <FloatingInput>
                <PasswordWrapper>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder=" "
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={formData.password ? "filled" : ""}
                  />
                  <label htmlFor="password">Contraseña segura</label>
                  <TogglePasswordButton
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </TogglePasswordButton>
                </PasswordWrapper>
                {errors.password && (
                  <ErrorMessage id="password-error" message={errors.password} />
                )}
              </FloatingInput>

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
                ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
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

const FloatingInput = styled.label`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 0.5rem;
  width: 100%;

  input {
    padding: 1.2rem 1rem 0.6rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 10px;
    background: #fefefe;
    transition: all 0.3s ease;
    width: 100%;
    
    /* Elimina el fondo azul del autocompletado */
    &:-webkit-autofill,
    &:-webkit-autofill:hover, 
    &:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0px 1000px #fefefe inset;
      -webkit-text-fill-color: #333;
      transition: background-color 5000s ease-in-out 0s;
    }

    &:focus {
      border-color: #007bff;
      outline: none;
      background: #fefefe;
    }
  }

  label {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1rem;
    color: #999;
    background: #fefefee6;
    padding: 0 4px;
    transition: all 0.2s ease;
    pointer-events: none;
  }

  input:focus + label,
  .filled + label {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #007bff;
    background: #fefefe;
  }

  ${PasswordWrapper} {
    position: relative;
    width: 100%;

    input {
      padding-right: 2.5rem;
    }
  }

  ${TogglePasswordButton} {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.25rem;
    z-index: 2;

    &:hover {
      color: #333;
    }
  }

  ${ErrorMessage} {
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #dc3545;
  }
`;