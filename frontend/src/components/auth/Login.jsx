import { useEffect } from "react";
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
  FormGroup,
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
  const { _id: authId } = useSelector((state) => state.auth);

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
  } = useLoginForm(dispatch, navigate);

  useEffect(() => {
    if (authId) {
      navigate("/cart");
    }
  }, [authId, navigate]);

  useEffect(() => {
    if (errors.form) {
      toast.error(errors.form);
    }
  }, [errors.form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleFirebaseLogin();
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

              <FormGroup>
                <label htmlFor="email">Correo</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  autoComplete="username"
                />
                {touched.email && errors.email && (
                  <ErrorMessage message={errors.email} />
                )}
              </FormGroup>

              <FormGroup>
                <label htmlFor="password">Contraseña</label>
                <PasswordWrapper>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                  />
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
              </FormGroup>

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