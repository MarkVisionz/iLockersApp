import { signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth as authFirebase } from "../../features/firebase-config";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithToken } from "../../features/authSlice";
import { loginWithFirebaseToken } from "../../services/authApiService";
import { FaApple } from "react-icons/fa";
import { useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { launchConfetti } from "../../utils/confetti";

const AppleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAppleLogin = async () => {
    setLoading(true);

    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");

      const result = await signInWithPopup(authFirebase, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Tu cuenta de Apple no proporciona correo electrónico");
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
      console.error("❌ Error en Apple Auth:", error);
      toast.error(error.message || "Error al autenticar con Apple", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppleButton
      type="button"
      onClick={handleAppleLogin}
      disabled={loading}
      aria-busy={loading}
    >
      <FaApple size={24} />
      {loading ? "Cargando..." : "Continuar con Apple"}
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
