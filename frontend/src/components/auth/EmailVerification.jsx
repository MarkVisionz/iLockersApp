import styled from "styled-components";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../../features/firebase-config";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { loginWithToken, clearVerification } from "../../features/authSlice";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";

const clearPendingVerification = () => {
  localStorage.removeItem("pendingVerificationEmail");
  localStorage.removeItem("pendingVerificationRole");
  localStorage.removeItem("token"); // Limpiar token previo
};

const EmailVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, isAuthenticated, loading } = useSelector((state) => state.auth || {});

  const [email] = useState(localStorage.getItem("pendingVerificationEmail") || "");
  const [status, setStatus] = useState({
    resent: false,
    loading: false,
    isChecking: false,
    error: null,
  });

  useEffect(() => {
    if (!email) {
      navigate("/register");
      return;
    }
    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          await handleVerified();
        }
      } catch (error) {
        console.error("Error al verificar estado del correo:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [email]);

  const handleResend = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No hay usuario autenticado");
      await sendEmailVerification(currentUser);
      setStatus((prev) => ({ ...prev, resent: true, loading: false }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: "Error al reenviar el correo",
      }));
    }
  };

  const handleVerified = async () => {
    setStatus((prev) => ({ ...prev, isChecking: true, error: null }));
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");
      await user.reload();
      if (!user.emailVerified) {
        throw { code: "auth/email-not-verified", message: "El correo aún no está verificado" };
      }

      const verifyResponse = await axios.post('/api/auth/verify-email', {
        email: user.email,
      });

      console.log("Respuesta de /api/auth/verify-email:", verifyResponse.data);

      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message || "Error al verificar email");
      }

      const token = verifyResponse.data.token;
      if (!token || typeof token !== "string") {
        throw new Error("Token inválido recibido del servidor");
      }

      console.log("Token decodificado:", jwtDecode(token)); // Depuración

      localStorage.setItem("token", token);
      await dispatch(loginWithToken({ token, serverUser: verifyResponse.data.user })).unwrap();
      clearPendingVerification();

      // Usar role del estado o del servidor como respaldo
      const effectiveRole = role || verifyResponse.data.user?.role;

      console.log("Effective role:", effectiveRole, "state.auth:", { role, isAuthenticated, loading });

      // Redirigir según el rol
      if (effectiveRole === "owner") {
        navigate("/setup-business");
      } else if (effectiveRole === "customer") {
        navigate("/cart");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Error al verificar:", err);
      setStatus((prev) => ({
        ...prev,
        isChecking: false,
        error: err.message || "Error inesperado",
      }));
      if (!err.code?.includes("auth/email-not-verified")) {
        setTimeout(() => handleVerified(), 5000);
      }
    }
  };

  useEffect(() => {
    // Redirigir cuando role e isAuthenticated estén disponibles
    console.log("useEffect state.auth:", { role, isAuthenticated, loading });
    if (!loading && isAuthenticated && role === "owner") {
      navigate("/setup-business");
    } else if (!loading && isAuthenticated && role === "customer") {
      navigate("/cart");
    } else if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, role, loading, navigate]);

  const handleBackToRegister = () => {
    dispatch(clearVerification());
    clearPendingVerification();
    navigate("/register");
  };

  return (
    <Wrapper>
      <ContentWrapper
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Title>📩 Verifica tu correo</Title>
        <Text>Te enviamos un enlace de verificación a <strong>{email}</strong>.</Text>
        <Text>Revisa tu bandeja de entrada o carpeta de spam.</Text>

        <ButtonGroup>
          <Button onClick={handleResend} disabled={status.loading || status.resent}>
            {status.loading ? <LoadingSpinner size="small" /> : "Reenviar correo"}
          </Button>
          <Button onClick={handleVerified} disabled={status.isChecking}>
            {status.isChecking ? <LoadingSpinner size="small" /> : "Ya verifiqué mi correo"}
          </Button>
          <Button onClick={handleBackToRegister} variant="secondary">
            Volver a Registro
          </Button>
        </ButtonGroup>

        {status.resent && <SuccessMessage>Correo reenviado correctamente</SuccessMessage>}
        {status.error && <ErrorMessage message={status.error} />}
      </ContentWrapper>
    </Wrapper>
  );
};

export default EmailVerification;

// Estilos
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
`;

const ContentWrapper = styled(motion.div)`
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.6rem;
  margin-bottom: 1rem;
`;

const Text = styled.p`
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.variant === "secondary" ? "transparent" : "#007bff"};
  color: ${props => props.variant === "secondary" ? "#007bff" : "white"};
  border: ${props => props.variant === "secondary" ? "1px solid #007bff" : "none"};

  &:hover {
    background: ${props => props.variant === "secondary" ? "#f0f7ff" : "#0056b3"};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.p`
  color: #28a745;
  font-size: 0.9rem;
  margin-top: 1rem;
`;