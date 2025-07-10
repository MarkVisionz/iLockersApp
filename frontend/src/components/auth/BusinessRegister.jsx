import { motion } from "framer-motion";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useFirebaseRegisterForm } from "../auth/Hooks/useFirebaseRegisterForm";
import { LoginBackground } from "../LoginBackground";
import { ErrorMessage, LoadingSpinner } from "../LoadingAndError";
import GoogleLoginButton from "../auth/GoogleLoginButton";
import FacebookLoginButton from "../auth/FacebookLoginButton";
import AppleLoginButton from "../auth/AppleLoginButton";
import styled from "styled-components";


import {
  BackgroundWrapper,
  PageWrapper,
  Form,
  ButtonLogin,
  SignupPrompt,
  PasswordWrapper,
  TogglePasswordButton,
} from "./StyledForm";

const BusinessRegister = () => {
  const {
    formData,
    errors,
    touched,
    showPassword,
    isSubmitting,
    handleInputChange,
    handleBlur,
    handleSubmit,
    setShowPassword,
  } = useFirebaseRegisterForm("owner");

  return (
    <LoginBackground>
      <BackgroundWrapper>
        <PageWrapper>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Form onSubmit={handleSubmit} aria-label="Business Register Form">
              <Title>Registrar Lavandería</Title>
              <Subtitle>Únete como propietario</Subtitle>

              <FloatingInput>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder=" "
                  aria-invalid={!!errors.name}
                  className={formData.name ? "filled" : ""}
                />
                <label htmlFor="name">Nombre Completo</label>
                {touched.name && errors.name && <ErrorMessage message={errors.name} />}
              </FloatingInput>

              <FloatingInput>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder=" "
                  aria-invalid={!!errors.email}
                  className={formData.email ? "filled" : ""}
                />
                <label htmlFor="email">Correo Electrónico</label>
                {touched.email && errors.email && <ErrorMessage message={errors.email} />}
              </FloatingInput>

              <FloatingInput>
                <PasswordWrapper>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder=" "
                    aria-invalid={!!errors.password}
                    className={formData.password ? "filled" : ""}
                  />
                  <label htmlFor="password">Contraseña</label>
                  <TogglePasswordButton type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </TogglePasswordButton>
                </PasswordWrapper>
                {touched.password && errors.password && <ErrorMessage message={errors.password} />}
              </FloatingInput>

              <ButtonLogin type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner message="Registrando..." /> : "Crear cuenta de negocio"}
              </ButtonLogin>

              {errors.form && <ErrorMessage message={errors.form} />}

              <Divider>o continúa con</Divider>
              <GoogleLoginButton role="owner" />
              <FacebookLoginButton role="owner" />
              <AppleLoginButton role="owner" />

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

export default BusinessRegister;


const Title = styled.h2`
  font-size: 1.6rem;
  text-align: center;
`;

const Subtitle = styled.p`
  text-align: center;
  font-size: 0.95rem;
  color: #888;
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