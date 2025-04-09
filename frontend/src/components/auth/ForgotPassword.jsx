// src/components/Auth/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../features/firebase-config";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../LoadingAndError";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/login"), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email) return setError("El correo es obligatorio");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError("No se pudo enviar el correo. Revisa el email o intenta más tarde.");
      console.error("❌ Error al enviar reset email:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Title>🔐 Recuperar contraseña</Title>
      <Subtitle>Te enviaremos un enlace para restaurar tu contraseña</Subtitle>

      <motion.form
        onSubmit={handleReset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Input
          type="email"
          placeholder="Correo registrado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Correo electrónico"
        />

        {error && <ErrorMessage message={error} />}

        {success && (
          <SuccessBox
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            ✅ Correo enviado correctamente. Serás redirigido al login en unos segundos...
          </SuccessBox>
        )}

        <Button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}>
          {loading ? "Enviando..." : "Enviar correo de recuperación"}
        </Button>
      </motion.form>
    </Container>
  );
};

export default ForgotPassword;

const Container = styled.div`
  max-width: 400px;
  margin: 5rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;

  @media (max-width: 480px) {
    margin: 2rem 1rem;
    padding: 1.5rem;
  }
`;

const Title = styled.h2`
  color: #007bff;
  font-size: 1.6rem;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #666;
  margin-top: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-top: 1.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 0.9rem;
  margin-top: 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0069d9;
  }
`;

const SuccessBox = styled(motion.div)`
  margin-top: 1.5rem;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
`;
