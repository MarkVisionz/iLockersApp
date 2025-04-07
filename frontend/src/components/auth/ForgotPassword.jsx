// src/components/Auth/ForgotPassword.jsx
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../features/firebase-config";
import styled from "styled-components";
import { motion } from "framer-motion";
import { ErrorMessage } from "../LoadingAndError";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <Container as={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Title>Recuperar contraseña</Title>
      <form onSubmit={handleReset}>
        <Input
          type="email"
          placeholder="Correo registrado"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <ErrorMessage message={error} />}
        {success && <p style={{ color: "green", marginTop: "1rem" }}> ✅ Correo enviado correctamente</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar correo de recuperación"}
        </Button>
      </form>
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
`;

const Title = styled.h2`
  text-align: center;
  color: #007bff;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-top: 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.9rem;
  margin-top: 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #0069d9;
  }
`;