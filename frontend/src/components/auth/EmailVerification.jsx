// src/components/Auth/EmailVerification.jsx
import styled from "styled-components";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { auth } from "../../features/firebase-config";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { loginWithToken, clearVerification } from "../../features/authSlice";
import { loginWithFirebaseToken } from "../../services/authApiService";
import { launchConfetti } from "../../utils/confetti";

const EmailVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState(
    localStorage.getItem("pendingVerificationEmail") || ""
  );
  const [status, setStatus] = useState({
    resent: false,
    loading: false,
    error: null,
    isChecking: false,
  });

  // Polling automático
  useEffect(() => {
    if (!email) return;

    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          clearInterval(interval);
          handleAlreadyVerified();
        }
      } catch (error) {
        console.error("Error verificando estado:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [email]);

  const handleResend = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No hay usuario autenticado");

      await sendEmailVerification(currentUser);
      setStatus({ resent: true, loading: false, error: null });
    } catch (err) {
      setStatus({
        resent: false,
        loading: false,
        error: "Error al reenviar el correo",
      });
    }
  };

  const handleAlreadyVerified = async () => {
    setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No hay usuario autenticado");

      await user.reload();

      if (!user.emailVerified) {
        throw {
          code: "auth/email-not-verified",
          message: "El correo aún no está verificado",
        };
      }

      const token = await user.getIdToken(true);

      // ⚠️ Aquí es donde puede fallar la creación en Mongo
      const res = await loginWithFirebaseToken(
        token,
        user.displayName || user.email.split("@")[0]
      );

      await dispatch(loginWithToken({ token: res.token }));

      localStorage.removeItem("pendingVerificationEmail");
      launchConfetti();
      navigate("/cart");
    } catch (err) {
      console.error("❌ Error en verificación o MongoDB:", err);

      // 🧹 Eliminar el usuario de Firebase si no se pudo guardar en Mongo
      if (
        err.response?.data?.message?.includes("Mongo") ||
        err.message?.includes("Mongo")
      ) {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.delete();
            console.log(
              "🗑️ Usuario eliminado de Firebase por fallo en MongoDB"
            );
          }
        } catch (deleteErr) {
          console.error(
            "⚠️ No se pudo eliminar de Firebase:",
            deleteErr.message
          );
        }
      }

      setStatus({
        isChecking: false,
        error:
          err.response?.data?.message ||
          err.message ||
          "Error al verificar el correo",
        showRetry: true,
      });

      if (!err.code?.includes("auth/email-not-verified")) {
        setTimeout(() => handleAlreadyVerified(), 5000);
      }
    }
  };

  const handleBackToRegister = () => {
    dispatch(clearVerification()); // 🔁 limpia verificationEmail del store
    localStorage.removeItem("pendingVerificationEmail");
    navigate("/register");
  };

  return (
    <Wrapper
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        key="form"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Title>📩 Verifica tu correo</Title>
        <Text>
          Te enviamos un enlace de verificación a{" "}
          <EmailHighlight>{email}</EmailHighlight>.
        </Text>
        <Text>
          Una vez confirmado, podrás iniciar sesión. También revisa la carpeta
          de spam.
        </Text>

        <ButtonGroup>
          <Button
            onClick={handleResend}
            disabled={status.loading || status.resent}
          >
            {status.loading ? "Enviando..." : "Reenviar correo"}
          </Button>

          <Button
            onClick={handleAlreadyVerified}
            style={{ background: "#28a745" }}
            disabled={status.isChecking}
          >
            {status.isChecking ? "Verificando..." : "Ya confirmé mi correo"}
          </Button>

          <Button
            onClick={handleBackToRegister}
            style={{ background: "#6c757d" }}
          >
            Volver a Registro
          </Button>
        </ButtonGroup>

        {status.resent && (
          <ResendMessage aria-live="polite">Correo reenviado ✅</ResendMessage>
        )}

        {status.error && (
          <ErrorMessage aria-live="polite">{status.error}</ErrorMessage>
        )}
        <WarningBox>
          Si no verificas tu correo en las próximas <strong>48 horas</strong>,
          tu cuenta será eliminada automáticamente por motivos de seguridad.
        </WarningBox>
      </motion.div>
    </Wrapper>
  );
};

export default EmailVerification;

const Wrapper = styled(motion.div)`
  max-width: 500px;
  margin: 4rem auto;
  background: #fff;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  text-align: center;

  @media (max-width: 768px) {
    margin: 2rem 1rem;
    padding: 2rem;
    border-radius: 16px;
  }

  @media (max-width: 480px) {
    padding: 1.5rem;
    border-radius: 12px;
  }
`;

const Title = styled.h2`
  font-size: 1.6rem;
  color: #007bff;

  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;

const Text = styled.p`
  font-size: 0.95rem;
  color: #555;
  margin-top: 1rem;

  @media (max-width: 480px) {
    font-size: 0.88rem;
  }
`;

const EmailHighlight = styled.span`
  font-weight: bold;
  color: #333;
  word-break: break-word;
`;

const ButtonGroup = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: 500px) {
    gap: 1rem;
  }
`;

const Button = styled.button`
  width: 70%;
  max-width: 320px;
  background: #007bff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin: 0 auto;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 400px) {
    width: 90%;
  }
`;

const ResendMessage = styled.p`
  font-size: 0.85rem;
  color: green;
  margin-top: 1rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  margin-top: 1rem;
  font-size: 0.9rem;

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const WarningBox = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  font-size: 0.9rem;

  strong {
    font-weight: bold;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

