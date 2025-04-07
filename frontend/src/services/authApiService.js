// src/services/api/authApiService.js
import axios from "axios";

// Configurable URL por entorno
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export const setHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...(token && { "x-auth-token": token }),
    },
  };
};

// Registro clásico
export const registerUserApi = async (userData) => {
  return await axios.post(`${BASE_URL}/register`, userData);
};

// 🔐 Login con token de Firebase luego de verificación de email/password
export const loginWithFirebaseToken = async (token, name) => {
  return await axios.post(`${BASE_URL}/auth/firebase-login`, {
    token,
    name, // ✅ se envía explícitamente el nombre tipeado
  });
};

// Login clásico
export const loginUserApi = async (userData) => {
  return await axios.post(`${BASE_URL}/login`, userData);
};

// Login con Google/Firebase
export const loginWithGoogleApi = async (token) => {
  return await axios.post(`${BASE_URL}/auth/firebase-login`, { token });
};

// Futuro: Login con Facebook
export const loginWithFacebookApi = async (token) => {
  return await axios.post(`${BASE_URL}/auth/facebook-login`, { token });
};
