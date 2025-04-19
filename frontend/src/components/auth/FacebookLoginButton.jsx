import {
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  auth as authFirebase,
  facebookProvider,
} from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithToken } from "../../features/authSlice";
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FaFacebookSquare } from "react-icons/fa";
import { useState } from "react";
import styled from "styled-components";
import { launchConfetti } from "../../utils/confetti";
import { toast } from "react-toastify";

const FacebookLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setLoading(true);

    try {
      await setPersistence(authFirebase, browserLocalPersistence);

      const result = await signInWithPopup(authFirebase, facebookProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Tu cuenta de Facebook no tiene correo asociado");
      }

      const token = await user.getIdToken(true);
      const res = await loginWithFirebaseToken(
        token,
        user.displayName || user.email.split("@")[0]
      );

      await dispatch(loginWithToken({ token: res.token })).unwrap();

      navigate("/cart");
      launchConfetti();
    } catch (error) {
      console.error("❌ Error en Facebook Auth:", error);
      toast.error(error.message || "Error al autenticar con Facebook", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FacebookButton
      type="button"
      onClick={handleFacebookLogin}
      disabled={loading}
      aria-busy={loading}
    >
      <FaFacebookSquare size={24} />
      {loading ? "Cargando..." : "Continuar con Facebook"}
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
