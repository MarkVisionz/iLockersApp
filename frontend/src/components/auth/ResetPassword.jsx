// src/components/Auth/ResetPassword.jsx
import { useEffect, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../features/firebase-config";
import styled from "styled-components";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ErrorMessage } from "../LoadingAndError";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (!oobCode) {
      setError("Código inválido o expirado.");
      return;
    }

    // Verificar que el código es válido
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setVerified(true);
      })
      .catch(() => {
        setError("El enlace ha expirado o es inválido.");
      });
  }, [oobCode]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      setError("No se pudo cambiar la contraseña. Intenta de nuevo.");
      console.error("❌ Error confirmando reset:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2>🔐 Nueva contraseña</h2>
      {!verified && !error && <p>Verificando enlace...</p>}

      {error && <ErrorMessage message={error} />}

      {verified && !success && (
        <form onSubmit={handleReset}>
          <Label>Correo: {email}</Label>
          <Input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Cambiando..." : "Cambiar contraseña"}
          </Button>
        </form>
      )}

      {success && (
        <SuccessMessage>
          ✅ Contraseña actualizada correctamente. Serás redirigido al login.
        </SuccessMessage>
      )}
    </Wrapper>
  );
};

export default ResetPassword;

// Estilos
const Wrapper = styled.div`
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

const Label = styled.p`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.9rem;
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

const SuccessMessage = styled.div`
  margin-top: 2rem;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
`;
