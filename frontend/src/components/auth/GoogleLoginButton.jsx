import { signInWithPopup, sendEmailVerification } from "firebase/auth";
import {
  auth as authFirebase,
  googleProvider,
} from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithToken } from "../../features/authSlice";
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
import styled from "styled-components";
import { launchConfetti } from "../../utils/confetti";
import { toast } from "react-toastify";

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(authFirebase, googleProvider);
      const user = result.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        throw {
          code: "auth/email-not-verified",
          message: "Por favor verifica tu email antes de continuar",
        };
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
      console.error("❌ Error en login Google:", error);
      toast.error(error.message || "Error al autenticar con Google", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleButton
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      aria-busy={loading}
    >
      <FcGoogle size={24} />
      {loading ? "Cargando..." : "Continuar con Google"}
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
