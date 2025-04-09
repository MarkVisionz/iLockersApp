import axios from "axios";

// 1. Instancia inteligente de Axios
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL: baseURL || "http://localhost:5001/api",
  });

  // Timeouts dinámicos
  instance.interceptors.request.use((config) => {
    config.timeout = config.url?.match(/auth|login/) ? 10000 : 30000;
    return config;
  });

  // Inyectar token automáticamente
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["x-auth-token"] = token;
    return config;
  });

  // Manejo centralizado de errores
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("🔴 Error en la petición:", {
        config: error.config,
        response: error.response?.data,
      });

      const errorData = {
        status: error.response?.status || 0,
        message: error.response?.data?.message || "Error desconocido",
        data: error.response?.data,
      };

      if (error.response?.status === 500) {
        errorData.message =
          "Error interno del servidor. Por favor intente más tarde";
      }

      return Promise.reject(errorData);
    }
  );

  return instance;
};

const api = createApiInstance(process.env.REACT_APP_API_URL);

// 2. Wrapper con reintentos
const withRetry = (fn, retries = 1) => {
  return async (...args) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        if (i === retries) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };
};

// 3. API auth centralizado
export const authApiService = {
  register: withRetry(async (userData) => {
    return api.post("/register", userData);
  }),

  loginWithFirebase: withRetry(async (token, name = null) => {
    const response = await api.post("/auth/firebase-login", {
      token,
      ...(name && { name }),
    });

    // Guardar token en localStorage 🔐
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  }, 2),

  firebaseRegister: withRetry(async ({ email, name, password }) => {
    const res = await api.post("/auth/firebase-register", {
      email,
      name,
      password,
      profileComplete: false,
    });
    return res.data;
  }),

  login: withRetry(async (credentials) => {
    const res = await api.post("/login", credentials);
    localStorage.setItem("token", res.data.token); // guarda token
    return res.data.token; // retorna solo el token (como espera loginUser)
  }),  

  verifyToken: withRetry(async () => {
    return api.get("/auth/verify");
  }),
};

// 4. Alias para compatibilidad con código existente
export const registerUserApi = authApiService.register;
export const loginUserApi = authApiService.login;
export const loginWithFirebaseToken = authApiService.loginWithFirebase;
export const finalizeFirebaseRegisterApi = authApiService.firebaseRegister;
