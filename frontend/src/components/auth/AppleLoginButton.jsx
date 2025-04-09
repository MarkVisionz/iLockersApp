import { signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth as authFirebase } from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../features/authSlice"; // ✅ unificado
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FaApple } from "react-icons/fa";
import { useState } from "react";
import styled from "styled-components";

const AppleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localStatus, setLocalStatus] = useState({
    loading: false,
    error: null,
  });

  const handleAppleLogin = async () => {
    setLocalStatus({ loading: true, error: null });

    try {
      // 1. Configuración del proveedor Apple
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");

      // 2. Autenticación con Apple
      const result = await signInWithPopup(authFirebase, provider);
      const user = result.user;

      // 3. Validar si tiene email
      if (!user.email) {
        throw new Error("Tu cuenta de Apple no proporciona correo electrónico");
      }

      // 4. Obtener token desde Firebase
      const token = await user.getIdToken(true);

      // 5. Enviar token al backend y obtener respuesta
      const res = await loginWithFirebaseToken(
        token,
        user.displayName || user.email.split("@")[0]
      );

      // 6. Guardar en Redux el token autenticado
      await dispatch(loginUser({ token })).unwrap();

      // 7. Redirigir
      navigate("/cart");
    } catch (error) {
      console.error("❌ Error en Apple Auth:", error);
      setLocalStatus({
        loading: false,
        error: error.message || "Error al autenticar con Apple",
      });
    }
  };

  return (
    <AppleButton
      type="button"
      onClick={handleAppleLogin}
      disabled={localStatus.loading}
      aria-busy={localStatus.loading}
    >
      <FaApple size={24} />
      {localStatus.loading ? "Cargando..." : "Continuar con Apple"}
      {localStatus.error && (
        <span className="sr-only">Error: {localStatus.error}</span>
      )}
    </AppleButton>
  );
};

const AppleButton = styled.button`
  width: 100%;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #1a1a1a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

export default AppleLoginButton;
