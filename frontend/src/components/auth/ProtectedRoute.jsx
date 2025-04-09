// src/components/Auth/ProtectedVerificationRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedVerificationRoute = ({ children }) => {
  const verificationEmail = useSelector((state) => state.auth.verificationEmail);

  if (!verificationEmail) {
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default ProtectedVerificationRoute;
