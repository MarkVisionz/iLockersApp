// src/features/authSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { auth } from "../features/firebase-config";
import { deleteUser } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import axios from "axios";
import { loginUserApi, loginWithFirebaseToken } from "../services/authApiService";
import {isFirebaseUser} from "../utils/checkFireBaseUser"

// 🔧 Helper para errores consistentes
const formatError = (error) => ({
  message: error.response?.data?.message || error.message,
  code: error.code,
  fields: error.response?.data?.errors || [],
});

// 🧠 Estado inicial
const initialState = {
  token: localStorage.getItem("token"),
  name: "",
  email: "",
  _id: "",
  isAdmin: false,
  registerStatus: "", // pending | email_sent | finalizing | completed | mongo_failed | failed
  registerError: null,
  loginStatus: "", // pending | success | failed
  loginError: null,
  userLoaded: false,
  verificationEmail: localStorage.getItem("pendingVerificationEmail") || "",
  profileComplete: false,
};

// 📩 REGISTRO - Firebase + email verificación
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      localStorage.setItem("tempUserData", JSON.stringify({ name, email }));

      return {
        email: cred.user.email,
        name,
        uid: cred.user.uid,
      };
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

// 📦 FINALIZAR registro: guarda en MongoDB
export const finalizeFirebaseRegistration = createAsyncThunk(
  "auth/finalizeFirebaseRegistration",
  async ({ email, name, uid }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/firebase-register", {
        email,
        name,
        password: uid, // puedes cambiar esto si manejas passwords reales
        profileComplete: false,
        firebaseUid: uid, // 🆕 importante para poder luego eliminar en Firebase
      });

      localStorage.removeItem("tempUserData");
      return res.data;
    } catch (error) {
      console.error("❌ Error en MongoDB. Intentando eliminar usuario en Firebase...");

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await deleteUser(currentUser);
          console.log("🗑️ Usuario eliminado de Firebase por fallo en MongoDB");
        } catch (deleteErr) {
          console.error("⚠️ No se pudo eliminar de Firebase:", deleteErr.message);
        }
      }

      return rejectWithValue(formatError(error));
    }
  }
);

// 🔐 LOGIN usando Firebase token
const handleLogin = async (authFn, credentials) => {
  try {
    const userCredential = await authFn(
      auth,
      credentials.email,
      credentials.password
    );
    await userCredential.user.reload();

    if (!userCredential.user.emailVerified) {
      throw { code: "auth/email-not-verified", message: "Email no verificado" };
    }

    const token = await userCredential.user.getIdToken();

    const res = await axios.post("/api/auth/firebase-login", {
      token,
      name:
        credentials.name ||
        userCredential.user.displayName ||
        userCredential.user.email.split("@")[0],
    });

    localStorage.setItem("token", res.data.token);
    return res.data.token;
  } catch (error) {
    throw formatError(error);
  }
};

// 🚪 LOGIN email/password
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const useFirebase = await isFirebaseUser(credentials.email);

      if (useFirebase) {
        // 🔐 Login Firebase
        return await handleLogin(signInWithEmailAndPassword, credentials);
      } else {
        // 🔐 Login tradicional (MongoDB)
        const res = await loginUserApi(credentials); // ← este ya guarda el token en localStorage
        return res; // retorna el token para ser decodificado por jwtDecode
      }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);




// Login with Token
export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
  async ({ token }, { rejectWithValue }) => {
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      return token;
    } catch (error) {
      return rejectWithValue({
        message: "Token inválido",
        code: "auth/invalid-token",
      });
    }
  }
);

// 🍰 SLICE
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadUser(state) {
      const token = state.token || localStorage.getItem("token");
      if (token) {
        try {
          const user = jwtDecode(token);
          return {
            ...state,
            ...user,
            token,
            userLoaded: true,
          };
        } catch {
          return { ...state, userLoaded: true };
        }
      }
      return { ...state, userLoaded: true };
    },
    logoutUser(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("pendingVerificationEmail");
      return initialState;
    },
    clearVerification(state) {
      state.verificationEmail = "";
      localStorage.removeItem("pendingVerificationEmail");
    },
    setVerificationEmail(state, action) {
      state.verificationEmail = action.payload;
      localStorage.setItem("pendingVerificationEmail", action.payload);
    },
    resetAuthErrors(state) {
      state.loginError = null;
      state.registerError = null;
    },
    loginUserSuccess(state, action) {
      const user = jwtDecode(action.payload);
      Object.assign(state, {
        ...user,
        token: action.payload,
        loginStatus: "success",
        loginError: null,
      });
    }
    
  },
  extraReducers: (builder) => {
    builder
      // ⏳ Registro
      .addCase(registerUser.pending, (state) => {
        state.registerStatus = "pending";
        state.registerError = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.registerStatus = "email_sent";
        state.verificationEmail = payload.email;
        state.name = payload.name;
        localStorage.setItem("pendingVerificationEmail", payload.email);
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.registerStatus = "failed";
        state.registerError = payload;
      })

      // ✅ Finalizar registro
      .addCase(finalizeFirebaseRegistration.pending, (state) => {
        state.registerStatus = "finalizing";
      })
      .addCase(finalizeFirebaseRegistration.fulfilled, (state, { payload }) => {
        state.registerStatus = "completed";
        state.token = payload.token;
        state.profileComplete = payload.user.profileComplete;
      })
      .addCase(finalizeFirebaseRegistration.rejected, (state, { payload }) => {
        state.registerStatus = "mongo_failed";
        state.registerError = payload;
      })

      // 🔑 Login
      .addCase(loginUser.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        const user = jwtDecode(payload);
        Object.assign(state, {
          ...user,
          token: payload,
          loginStatus: "success",
        });
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loginStatus = "failed";
        state.loginError = payload;
      })
      .addCase(loginWithToken.fulfilled, (state, { payload }) => {
        const user = jwtDecode(payload);
        Object.assign(state, {
          ...user,
          token: payload,
          loginStatus: "success",
        });
      })
      .addCase(loginWithToken.rejected, (state, { payload }) => {
        state.loginStatus = "failed";
        state.loginError = payload;
      });
  },
});

export const { loadUser, logoutUser, clearVerification, setVerificationEmail, resetAuthErrors, loginUserSuccess } =
  authSlice.actions;
export default authSlice.reducer;
