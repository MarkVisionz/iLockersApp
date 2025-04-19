import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth as firebaseAuth } from "../../features/firebase-config";
import axios from "axios";
import { url, setHeaders } from "../../features/api";
import { toast } from "react-toastify";
import styled from "styled-components";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("oobCode");
    if (code) {
      setOobCode(code);
      // Verificar el código
      verifyPasswordResetCode(firebaseAuth, code)
        .then((email) => {
          console.log("Código de restablecimiento válido para:", email);
        })
        .catch((err) => {
          console.error("Error al verificar código:", err);
          setError("Enlace inválido o expirado");
        });
    } else {
      setError("No se proporcionó un código de restablecimiento");
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      // Aplicar el restablecimiento en Firebase
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      console.log("Contraseña restablecida en Firebase");

      // Obtener el usuario actual (debería estar autenticado tras el restablecimiento)
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error("No se pudo autenticar al usuario tras el restablecimiento");
      }

      const idToken = await currentUser.getIdToken(true);
      console.log("Token obtenido:", idToken.slice(0, 10) + "...");

      // Actualizar authProvider en el backend
      const res = await axios.put(
        `${url}/users/${currentUser.uid}`,
        {
          authProvider: "password",
          fromResetFlow: true,
        },
        {
          headers: {
            ...setHeaders().headers,
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (res.status === 200 && res.data.success) {
        console.log("Backend actualizado: authProvider = password");
        toast.success("¡Contraseña establecida! Inicia sesión con tu nueva contraseña.");
        navigate("/login");
      } else {
        throw new Error(res.data.message || "Error al actualizar el backend");
      }
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      setError(error.message || "Error al establecer la contraseña");
      toast.error(error.message || "Error al establecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResetContainer>
      <h2>Establecer nueva contraseña</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ResetForm onSubmit={handleSubmit}>
        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label>
          Confirmar contraseña
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={loading || !oobCode}>
          {loading ? "Procesando..." : "Establecer contraseña"}
        </button>
      </ResetForm>
    </ResetContainer>
  );
};

export default ResetPassword;

const ResetContainer = styled.div`
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ResetForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  label {
    font-weight: bold;
    text-align: left;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  button {
    background: #007bff;
    color: white;
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background: #0056b3;
    }

    &:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }
  }
`;