// src/components/Auth/FacebookLoginButton.jsx
import { signInWithPopup } from "firebase/auth";
import { auth as authFirebase, facebookProvider } from "../../features/firebase-config";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../../features/authSlice"; // Reutilizamos la misma acción
import styled from "styled-components";
import { FaFacebookSquare } from "react-icons/fa";


const FacebookLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(authFirebase, facebookProvider);
      const token = await result.user.getIdToken();
      await dispatch(loginWithGoogle(token)).unwrap();
      navigate("/cart");
    } catch (err) {
      console.error("❌ Error Facebook Auth:", err);
    }
  };

  return (
    <FacebookButton type="button" onClick={handleFacebookLogin} disabled={auth.loginStatus === "pending"}>
      <FaFacebookSquare size={24} />
      {auth.loginStatus === "pending" ? "Cargando..." : "Continuar con Facebook"}
    </FacebookButton>
  );
};

export default FacebookLoginButton;

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