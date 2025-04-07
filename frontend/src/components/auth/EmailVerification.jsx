// src/components/Auth/EmailVerification.jsx
import styled from "styled-components";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "../../features/firebase-config";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginWithGoogle } from "../../features/authSlice";
import { launchConfetti } from "../../utils/confetti";
import { loginWithFirebaseToken } from "../../services/authApiService";

const EmailVerification = ({ email }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        setResent(true);
      }
    } catch (err) {
      console.error("❌ Error reenviando correo:", err);
    }
  };

  const handleAlreadyVerified = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Usuario no autenticado. Vuelve a iniciar sesión.");
        return;
      }

      await user.reload();

      console.log("👤 Usuario actual:", user);
      console.log("📨 Verificado:", user.emailVerified);

      if (!user.emailVerified) {
        alert("Tu correo aún no ha sido verificado.");
        return;
      }

      const token = await user.getIdToken(true); // fuerza token fresco
      const name = user.displayName || user.email.split("@")[0];
      console.log("🪪 ID Token válido:", token);

      const res = await loginWithFirebaseToken(token, user.displayName || user.email.split("@")[0]);
      console.log("✅ Respuesta del backend:", res.data);

      launchConfetti();
      dispatch(loginWithGoogle(res.data.token));
      navigate("/cart");
    } catch (err) {
      console.error("❌ Error al verificar correo:", err);
      alert("Ocurrió un error al intentar verificar tu cuenta.");
    }
  };

  return (
    <Wrapper
      key="email-verification"
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
        Una vez confirmado, podrás iniciar sesión. También revisa la carpeta de spam.
      </Text>

      <Button onClick={handleResend}>Reenviar correo</Button>
      {resent && <ResendMessage>Correo reenviado ✅</ResendMessage>}

      <Button onClick={handleAlreadyVerified} style={{ background: "#28a745" }}>
        Ya confirmé mi correo
      </Button>
    </Wrapper>
  );
};

export default EmailVerification;

// 🧱 Estilos
const Wrapper = styled(motion.div)`
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h2`
  font-size: 1.6rem;
  color: #007bff;
`;

const Text = styled.p`
  font-size: 0.95rem;
  color: #555;
  margin-top: 1rem;
`;

const EmailHighlight = styled.span`
  font-weight: bold;
  color: #333;
`;

const Button = styled.button`
  margin-top: 2rem;
  background: #007bff;
  color: white;
  border: none;
  padding: 0.8rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const ResendMessage = styled.p`
  font-size: 0.85rem;
  color: green;
  margin-top: 1rem;
`;