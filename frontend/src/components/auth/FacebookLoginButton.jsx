import { signInWithPopup, setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth as authFirebase, facebookProvider } from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithToken } from "../../features/authSlice";
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FaFacebookSquare } from "react-icons/fa";
import { useState } from "react";
import styled from "styled-components";
import { launchConfetti } from "../../utils/confetti";


const FacebookLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localStatus, setLocalStatus] = useState({
    loading: false,
    error: null,
  });

  const handleFacebookLogin = async () => {
    setLocalStatus({ loading: true, error: null });

    try {
      // ✅ 1. Establecer persistencia en localStorage
      await setPersistence(authFirebase, browserLocalPersistence);

      // ✅ 2. Autenticación con Facebook
      const result = await signInWithPopup(authFirebase, facebookProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Tu cuenta de Facebook no tiene correo asociado");
      }

      // ✅ 3. Obtener token de Firebase
      const token = await user.getIdToken(true);

      // ✅ 4. Llamar al backend para crear o cargar usuario
      const res = await loginWithFirebaseToken(
        token,
        user.displayName || user.email.split("@")[0]
      );

      // ✅ 5. Guardar token en Redux
      await dispatch(loginWithToken({ token: res.token })).unwrap();

      // ✅ 6. Redirigir
      navigate("/cart");
      launchConfetti();
    } catch (error) {
      console.error("❌ Error en Facebook Auth:", error);
      setLocalStatus({
        loading: false,
        error: error.message || "Error al autenticar con Facebook",
      });
    }
  };

  return (
    <FacebookButton
      type="button"
      onClick={handleFacebookLogin}
      disabled={localStatus.loading}
      aria-busy={localStatus.loading}
    >
      <FaFacebookSquare size={24} />
      {localStatus.loading ? "Cargando..." : "Continuar con Facebook"}
      {localStatus.error && (
        <span className="sr-only">Error: {localStatus.error}</span>
      )}
    </FacebookButton>
  );
};

const FacebookButton = styled.button`
  width: 100%;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #1877f2;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #165cbe;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

export default FacebookLoginButton;
