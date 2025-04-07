// authSlice.js actualizado con finalizeFirebaseRegistration
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { loginUserApi, loginWithGoogleApi } from "../services/authApiService";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../features/firebase-config";
import axios from "axios";

const initialState = {
  token: localStorage.getItem("token"),
  name: "",
  email: "",
  _id: "",
  isAdmin: false,
  registerStatus: "",
  registerError: "",
  loginStatus: "",
  loginError: "",
  userLoaded: false,
  verificationEmail: "",
};

// REGISTRO y verificación
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);

      return {
        status: "verification_sent",
        email: cred.user.email,
        name,
      };
    } catch (err) {
      return rejectWithValue([{ field: "form", message: err.message }]);
    }
  }
);

// Finaliza registro y guarda en Mongo después de verificar
export const finalizeFirebaseRegistration = createAsyncThunk(
  "auth/finalizeFirebaseRegistration",
  async ({ email, name }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/firebase-register", {
        email,
        name,
        password: "firebase_oauth",
      });

      return res.data;
    } catch (error) {
      return rejectWithValue("Error al guardar en MongoDB");
    }
  }
);

// LOGIN tradicional
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (user, { rejectWithValue }) => {
    try {
      const res = await loginUserApi(user);
      const { token } = res.data;
      localStorage.setItem("token", token);
      return token;
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        errorData?.errors || {
          message: errorData?.message || "Error al iniciar sesión",
        }
      );
    }
  }
);

// LOGIN CON GOOGLE
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (token, { rejectWithValue }) => {
    try {
      const res = await loginWithGoogleApi(token);
      localStorage.setItem("token", res.data.token);
      return res.data.token;
    } catch (err) {
      return rejectWithValue({ message: "Error en login con Google" });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadUser(state) {
      const token = state.token;
      if (token) {
        const user = jwtDecode(token);
        return {
          ...state,
          token,
          name: user.name,
          email: user.email,
          _id: user._id,
          isAdmin: user.isAdmin,
          userLoaded: true,
        };
      }
      return { ...state, userLoaded: true };
    },
    logoutUser(state) {
      localStorage.removeItem("token");
      return {
        ...initialState,
        token: "",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.registerStatus = "pending";
        state.registerError = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.registerStatus = "email_sent";
        state.verificationEmail = action.payload.email;
        state.name = action.payload.name;
        state.registerError = "";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registerStatus = "rejected";
        state.registerError = action.payload;
      })

      .addCase(finalizeFirebaseRegistration.pending, (state) => {
        state.registerStatus = "saving_user";
      })
      .addCase(finalizeFirebaseRegistration.fulfilled, (state) => {
        state.registerStatus = "completed";
      })
      .addCase(finalizeFirebaseRegistration.rejected, (state) => {
        state.registerStatus = "mongo_error";
      })

      .addCase(loginUser.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const user = jwtDecode(action.payload);
        state.token = action.payload;
        state.name = user.name;
        state.email = user.email;
        state._id = user._id;
        state.isAdmin = user.isAdmin;
        state.loginStatus = "success";
        state.loginError = "";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = "rejected";
        state.loginError = Array.isArray(action.payload)
          ? action.payload
          : [
              {
                field: "form",
                message: action.payload?.message || "Error inesperado",
              },
            ];
      })

      .addCase(loginWithGoogle.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = "";
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        const user = jwtDecode(action.payload);
        state.token = action.payload;
        state.name = user.name;
        state.email = user.email;
        state._id = user._id;
        state.isAdmin = user.isAdmin;
        state.loginStatus = "success";
        state.loginError = "";
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loginStatus = "rejected";
        state.loginError = [
          {
            field: "form",
            message: action.payload?.message || "Error en login con Google",
          },
        ];
      });
  },
});

export const { loadUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
