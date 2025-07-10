import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import styled from "styled-components";
import { toast } from "react-toastify";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useLoginForm } from "./Hooks/useLoginForm";
import {
  BackgroundWrapper,
  PageWrapper,
  Form,
  ButtonLogin,
  SignupPrompt,
  PasswordWrapper,
  TogglePasswordButton,
  ForgotLink,
} from "./StyledForm";
import { LoginBackground } from "../LoginBackground";
import GoogleLoginButton from "./GoogleLoginButton";
import FacebookLoginButton from "./FacebookLoginButton";
import AppleLoginButton from "./AppleLoginButton";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isAdmin, role, defaultBusiness, authProvider } = useSelector((state) => state.auth);
  const [loginSuccess, setLoginSuccess] = useState(null);

  const handleLoginSuccess = (userData) => {
    setLoginSuccess(userData);
  };

  const {
    formData,
    errors,
    touched,
    showPassword,
    isSubmitting,
    remainingAttempts,
    setShowPassword,
    handleInputChange,
    handleBlur,
    handleFirebaseLogin,
  } = useLoginForm(dispatch, navigate, handleLoginSuccess);

  useEffect(() => {
    if (isAuthenticated && loginSuccess) {
      console.log("Login.jsx: Manejo de redirección post-login:", {
        isAdmin,
        role,
        defaultBusiness,
        authProvider,
        loginSuccess,
      });

      if (isAdmin) {
        navigate("/admin/summary", { replace: true });
      } else if (role === "owner" && defaultBusiness) {
        navigate(`/owner/local-summary/${defaultBusiness}`, { replace: true });
      } else {
        navigate("/cart", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, role, defaultBusiness, authProvider, loginSuccess, navigate]);

  useEffect(() => {
    if (errors.form) {
      toast.error(errors.form);
    }
  }, [errors.form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleFirebaseLogin();
    } catch (error) {
      toast.error(error.message || "Error al iniciar sesión");
    }
  };

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
              animate={errors.form ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
              transition={errors.form ? { duration: 0.4 } : {}}
              aria-label="Formulario de inicio de sesión"
            >
              <h2>Inicia Sesión</h2>

              {errors.form && (
                <ErrorMessage
                  message={errors.form}
                  style={{ marginBottom: "1rem" }}
                />
              )}

              {remainingAttempts !== null && (
                <AttemptsWarning>
                  Intentos restantes: {remainingAttempts}
                </AttemptsWarning>
              )}

              <FloatingInput>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  autoComplete="username"
                  className={formData.email ? "filled" : ""}
                />
                <label htmlFor="email">Correo electrónico</label>
                {touched.email && errors.email && (
                  <ErrorMessage message={errors.email} />
                )}
              </FloatingInput>

              <FloatingInput>
                <PasswordWrapper>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder=" "
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                    className={formData.password ? "filled" : ""}
                  />
                  <label htmlFor="password">Contraseña</label>
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
                {touched.password && errors.password && (
                  <ErrorMessage message={errors.password} />
                )}
              </FloatingInput>

              <ForgotLink>
                <Link to="/forgot-password" aria-label="Recuperar contraseña">
                  ¿Olvidaste tu contraseña?
                </Link>
              </ForgotLink>

              <ButtonLogin disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? (
                  <LoadingSpinner message="Iniciando sesión..." />
                ) : (
                  "Entrar"
                )}
              </ButtonLogin>

              <Divider>o continúa con:</Divider>

              <GoogleLoginButton />
              <FacebookLoginButton />
              <AppleLoginButton />

              <SignupPrompt>
                ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
              </SignupPrompt>
            </Form>
          </motion.div>
        </PageWrapper>
      </BackgroundWrapper>
    </LoginBackground>
  );
};

export default Login;

const AttemptsWarning = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
  margin-bottom: 0.5rem;
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
    transition: border 0.3s;
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