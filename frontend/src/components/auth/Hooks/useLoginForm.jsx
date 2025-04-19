import { useState } from "react";
import { validateEmail } from "../../../features/validators";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "../../../features/firebase-config";
import axios from "axios";
import { url } from "../../../features/api";
import { loginUserSuccess } from "../../../features/authSlice";

export const useLoginForm = (dispatch, navigate) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);

  const validateForm = () => {
    const newErrors = { email: "", password: "", form: "" };

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Correo inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    } else if (formData.password.length > 50) {
      newErrors.password = "Máximo 50 caracteres";
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateForm();
    }
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateForm();
  };

  const handleBackendError = (error) => {
    const res = error?.response?.data;
    const msg = res?.message || "Error desconocido";
    console.log("Backend error:", { error, res, msg }); // Log temporal para depuración

    if (msg.includes("bloqueada")) {
      setErrors({ email: "", password: "", form: msg });
    } else if (msg.match(/ya est(á|a) registrado|otro m(é|e)todo|registrado.*método/i)) {
      setErrors({
        email: "",
        password: "",
        form: "Correo ya registrado con otro método de autenticación",
      });
    } else if (res?.remainingAttempts !== undefined) {
      setRemainingAttempts(res.remainingAttempts);
      setErrors({
        email: "",
        password: "Contraseña incorrecta",
        form: msg || "Correo o contraseña incorrectos",
      });
    } else if (msg.includes("Credenciales inválidas")) {
      setErrors({
        email: "",
        password: "Contraseña incorrecta",
        form: "Correo o contraseña incorrectos",
      });
    } else {
      setErrors({
        email: "",
        password: "",
        form: msg || "Error al conectar con el servidor",
      });
    }
  };

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setErrors({ email: "", password: "", form: "" });
    setTouched({ email: false, password: false });
    setRemainingAttempts(null);
  };

  const handleFirebaseLogin = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const token = await user.getIdToken(true);

      const response = await axios.post(`${url}/auth/firebase-login`, {
        token,
        name: user.displayName || formData.email.split("@")[0],
      });

      localStorage.setItem("token", response.data.token);
      dispatch(loginUserSuccess(response.data.token));
      resetForm();
      navigate("/cart");
    } catch (error) {
      console.log("Firebase error:", {
        code: error.code,
        message: error.message,
        details: error,
      }); // Log mejorado para depuración
      switch (error.code) {
        case "auth/user-not-found":
          setErrors({
            email: "",
            password: "",
            form: "Correo no registrado",
          });
          break;
        case "auth/wrong-password":
          setErrors({
            email: "",
            password: "Contraseña incorrecta",
            form: "Correo o contraseña incorrectos",
          });
          break;
        case "auth/invalid-email":
          setErrors({
            email: "Correo inválido",
            password: "",
            form: "El formato del correo es incorrecto",
          });
          break;
        case "auth/too-many-requests":
          setErrors({
            email: "",
            password: "",
            form: "Demasiados intentos fallidos. Intenta de nuevo más tarde",
          });
          break;
        case "auth/invalid-credential":
          setErrors({
            email: "",
            password: "",
            form: "Correo o contraseña incorrectos", // Más específico que "Credenciales inválidas"
          });
          break;
        default:
          handleBackendError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    touched,
    showPassword,
    isSubmitting,
    remainingAttempts,
    setShowPassword,
    handleInputChange,
    handleBlur,
    validateForm,
    handleBackendError,
    resetForm,
    handleFirebaseLogin,
  };
};