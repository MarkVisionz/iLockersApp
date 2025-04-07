// src/components/Auth/AppleLoginButton.jsx
import { signInWithPopup, OAuthProvider } from "firebase/auth";
import { auth as authFirebase } from "../../features/firebase-config";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../../features/authSlice";
import styled from "styled-components";
import { FaApple } from "react-icons/fa";


const AppleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const handleAppleLogin = async () => {
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");

      const result = await signInWithPopup(authFirebase, provider);
      const token = await result.user.getIdToken();
      await dispatch(loginWithGoogle(token)).unwrap();
      navigate("/cart");
    } catch (err) {
      console.error("❌ Error Apple Auth:", err);
    }
  };

  return (
    <AppleButton type="button" onClick={handleAppleLogin} disabled={auth.loginStatus === "pending"}>
      <FaApple size={24} />
      {auth.loginStatus === "pending" ? "Cargando..." : "Continuar con Apple"}
    </AppleButton>
  );
};

export default AppleLoginButton;

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