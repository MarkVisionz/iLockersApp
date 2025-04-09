// src/components/Auth/GoogleLoginButton.jsx
import { signInWithPopup, sendEmailVerification } from "firebase/auth";
import {
  auth as authFirebase,
  googleProvider,
} from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithToken } from "../../features/authSlice"; // ✅ Thunk unificado
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import styled from "styled-components";
import { launchConfetti } from "../../utils/confetti";


const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localStatus, setLocalStatus] = useState({
    loading: false,
    error: null,
  });

  const handleGoogleLogin = async () => {
    setLocalStatus({ loading: true, error: null });

    try {
      // 1. Autenticación con Google
      const result = await signInWithPopup(authFirebase, googleProvider);
      const user = result.user;

      // 2. Verificación de email
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        throw {
          code: "auth/email-not-verified",
          message: "Por favor verifica tu email antes de continuar",
        };
      }

      // 3. Obtener token de Firebase
      const token = await user.getIdToken(true);

      // 4. Llamada a backend y dispatch a Redux
      const res = await loginWithFirebaseToken(
        token,
        user.displayName || user.email.split("@")[0]
      );

      await dispatch(loginWithToken({ token: res.token })).unwrap();

      // 5. Redirigir
      navigate("/cart");
      launchConfetti();
    } catch (error) {
      console.error("❌ Error en login Google:", error);
      setLocalStatus({
        loading: false,
        error: error.message || "Error al autenticar con Google",
      });
    }
  };

  return (
    <GoogleButton
      type="button"
      onClick={handleGoogleLogin}
      disabled={localStatus.loading}
      aria-busy={localStatus.loading}
    >
      <FcGoogle size={24} />
      {localStatus.loading ? "Cargando..." : "Continuar con Google"}
      {localStatus.error && (
        <span className="sr-only">Error: {localStatus.error}</span>
      )}
    </GoogleButton>
  );
};

const GoogleButton = styled.button`
  width: 100%;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #444;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f7f7f7;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

export default GoogleLoginButton;
