// src/components/Auth/GoogleLoginButton.jsx
import { signInWithPopup } from "firebase/auth";
import {
  auth as authFirebase,
  googleProvider,
} from "../../features/firebase-config";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../../features/authSlice";
import styled from "styled-components";
import { FcGoogle } from "react-icons/fc";

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(authFirebase, googleProvider);
      const token = await result.user.getIdToken();
      await dispatch(loginWithGoogle(token)).unwrap();
      navigate("/cart");
    } catch (err) {
      console.error("❌ Error Google Auth:", err);
    }
  };

  return (
    <GoogleButton
      type="button"
      onClick={handleGoogleLogin}
      disabled={auth.loginStatus === "pending"}
    >
      <FcGoogle size={24} />
      {auth.loginStatus === "pending" ? "Cargando..." : "Continuar con Google"}
    </GoogleButton>
  );
};

export default GoogleLoginButton;

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
