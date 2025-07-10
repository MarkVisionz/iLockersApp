import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { auth } from "../features/firebase-config";
import { deleteUser, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { loginUserApi } from "../services/authApiService";
import { isFirebaseUser } from "../utils/checkFireBaseUser";
import { url, setHeaders } from "./api";

const formatError = (error) => ({
  message: error?.response?.data?.message || error?.message || "Error desconocido",
  code: error?.code,
  fields: error?.response?.data?.errors || [],
});

const initialState = {
  token: localStorage.getItem("token") || null,
  name: "",
  email: "",
  _id: "",
  isAdmin: false,
  isBusinessOwner: false,
  businesses: JSON.parse(localStorage.getItem("businesses")) || [],
  registerStatus: "",
  registerError: null,
  loginStatus: "",
  loginError: null,
  userLoaded: false,
  verificationEmail: localStorage.getItem("pendingVerificationEmail") || "",
  profileComplete: false,
  role: null,
  registrationStep: null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: true,
  defaultBusiness: null,
};

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password, isBusinessOwner = false }, { rejectWithValue }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      localStorage.setItem("tempUserData", JSON.stringify({ name, email, isBusinessOwner }));
      return { email: cred.user.email, name, uid: cred.user.uid, isBusinessOwner };
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const finalizeFirebaseRegistration = createAsyncThunk(
  "auth/finalizeFirebaseRegistration",
  async ({ email, name, uid, isBusinessOwner }, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/firebase-register", {
        email,
        name,
        password: uid,
        profileComplete: false,
        firebaseUid: uid,
        isBusinessOwner,
      });
      localStorage.removeItem("tempUserData");
      localStorage.setItem("token", res.data.token);
      return res.data;
    } catch (error) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await deleteUser(currentUser);
        } catch (err) {
          console.error("❌ Error al eliminar usuario Firebase:", err.message);
        }
      }
      return rejectWithValue(formatError(error));
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const useFirebase = await isFirebaseUser(credentials.email);
      if (useFirebase) {
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        await userCredential.user.reload();
        if (!userCredential.user.emailVerified) {
          throw { code: "auth/email-not-verified", message: "Email no verificado" };
        }
        const token = await userCredential.user.getIdToken();
        const res = await axios.post("/api/auth/firebase-login", {
          token,
          name: credentials.name || userCredential.user.displayName || userCredential.user.email.split("@")[0],
        });
        localStorage.setItem("token", res.data.token);
        return { token: res.data.token, user: res.data.user };
      } else {
        const res = await loginUserApi(credentials);
        return { token: res.token, user: res.user };
      }
    } catch (error) {
      return rejectWithValue(formatError(error));
    }
  }
);

export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
  async ({ token, serverUser }, { rejectWithValue }) => {
    try {
      console.log("Token recibido en loginWithToken:", token ? `Presente (${token.substring(0, 20)}...)` : "Ausente");
      if (!token || typeof token !== "string") {
        throw new Error("Token inválido: no es una cadena");
      }
      const user = jwtDecode(token);
      localStorage.setItem("token", token);
      return { token, user, serverUser };
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue({ message: error.message || "Token inválido", code: "auth/invalid-token" });
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const decodedUser = jwtDecode(token);
      const { _id } = decodedUser;
      console.log("Cargando usuario con _id:", _id);

      if (!_id) {
        throw new Error("No se encontró _id en el token");
      }

      const response = await axios.get(`${url}/users/${_id}`, setHeaders());
      const fullUserData = response.data.user || response.data;

      console.log("Datos del usuario cargados:", {
        _id: fullUserData._id,
        role: fullUserData.role,
        defaultBusiness: fullUserData.defaultBusiness,
      });

      const businesses = fullUserData.businesses || JSON.parse(localStorage.getItem("businesses")) || [];
      localStorage.setItem("businesses", JSON.stringify(businesses));

      return {
        token,
        user: {
          ...decodedUser,
          ...fullUserData,
          businesses,
          defaultBusiness: fullUserData.defaultBusiness || decodedUser.defaultBusiness,
        },
      };
    } catch (error) {
      console.error("loadUser error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(formatError(error));
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginUserSuccess(state, action) {
      const { token, user } = action.payload;
      const decodedUser = jwtDecode(token);
      state.token = token;
      state.name = user.name || decodedUser.name || "";
      state.email = user.email || decodedUser.email || "";
      state._id = user._id || decodedUser._id || "";
      state.isAdmin = user.isAdmin || decodedUser.isAdmin || false;
      state.isBusinessOwner = user.isBusinessOwner || decodedUser.isBusinessOwner || false;
      state.businesses = user.businesses || decodedUser.businesses || [];
      state.role = user.role || decodedUser.role || null;
      state.registrationStep = user.registrationStep || decodedUser.registrationStep || null;
      state.defaultBusiness = user.defaultBusiness || decodedUser.defaultBusiness || null;
      state.isAuthenticated = true;
      state.loginStatus = "success";
      state.loginError = null;
      state.userLoaded = true;
      state.loading = false;
    },
    logoutUser(state) {
      localStorage.removeItem("token");
      localStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("businesses");
      Object.assign(state, { ...initialState, loading: false });
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
    setAuthFromUserData(state, action) {
      const userData = action.payload;
      state.token = userData.token || state.token;
      state.name = userData.name || "";
      state.email = userData.email || "";
      state._id = userData._id || "";
      state.isAdmin = userData.isAdmin || false;
      state.isBusinessOwner = userData.isBusinessOwner || false;
      state.businesses = userData.businesses || [];
      state.role = userData.role || null;
      state.registrationStep = userData.registrationStep || null;
      state.defaultBusiness = userData.defaultBusiness || null;
      state.isAuthenticated = true;
      state.userLoaded = true;
      state.loading = false;
      localStorage.setItem("businesses", JSON.stringify(userData.businesses || []));
    },
    businessDeleted(state, action) {
      const businessId = action.payload;
      state.businesses = state.businesses.filter((b) => String(b._id) !== String(businessId));
      if (state.defaultBusiness === businessId) {
        state.defaultBusiness = state.businesses.length > 0 ? state.businesses[0]._id : null;
      }
      localStorage.setItem('businesses', JSON.stringify(state.businesses));
    },
    updateAuthBusiness(state, action) {
      const updatedBusiness = action.payload;
      console.log("Updating auth.businesses with:", updatedBusiness);
      const index = state.businesses.findIndex(
        (b) => String(b._id) === String(updatedBusiness._id)
      );
      if (index !== -1) {
        state.businesses[index] = updatedBusiness;
      } else {
        state.businesses.push(updatedBusiness);
      }
      localStorage.setItem('businesses', JSON.stringify(state.businesses));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.registerStatus = "pending";
        state.registerError = null;
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.registerStatus = "email_sent";
        state.verificationEmail = payload.email;
        state.name = payload.name;
        state.isBusinessOwner = payload.isBusinessOwner;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.registerStatus = "failed";
        state.registerError = payload;
        state.loading = false;
      })
      .addCase(finalizeFirebaseRegistration.pending, (state) => {
        state.registerStatus = "finalizing";
        state.loading = true;
      })
      .addCase(finalizeFirebaseRegistration.fulfilled, (state, { payload }) => {
        state.registerStatus = "completed";
        state.token = payload.token;
        state.profileComplete = payload.user.profileComplete;
        state._id = payload.user._id;
        state.email = payload.user.email;
        state.name = payload.user.name;
        state.isAdmin = payload.user.isAdmin || false;
        state.isBusinessOwner = payload.user.isBusinessOwner || false;
        state.businesses = payload.user.businesses || [];
        state.role = payload.user.role || null;
        state.registrationStep = payload.user.registrationStep || null;
        state.defaultBusiness = payload.user.defaultBusiness || null;
        state.isAuthenticated = true;
        state.userLoaded = true;
        state.loading = false;
      })
      .addCase(finalizeFirebaseRegistration.rejected, (state, { payload }) => {
        state.registerStatus = "mongo_failed";
        state.registerError = payload;
        state.loading = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = null;
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        const { token, user } = payload;
        const decodedUser = jwtDecode(token);
        state.token = token;
        state.name = user.name || decodedUser.name || "";
        state.email = user.email || decodedUser.email || "";
        state._id = user._id || decodedUser._id || "";
        state.isAdmin = user.isAdmin || decodedUser.isAdmin || false;
        state.isBusinessOwner = user.isBusinessOwner || decodedUser.isBusinessOwner || false;
        state.businesses = user.businesses || decodedUser.businesses || [];
        state.role = user.role || decodedUser.role || null;
        state.registrationStep = user.registrationStep || decodedUser.registrationStep || null;
        state.defaultBusiness = user.defaultBusiness || decodedUser.defaultBusiness || null;
        state.isAuthenticated = true;
        state.loginStatus = "success";
        state.loginError = null;
        state.userLoaded = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loginStatus = "failed";
        state.loginError = payload;
        state.loading = false;
      })
      .addCase(loginWithToken.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = null;
        state.loading = true;
      })
      .addCase(loginWithToken.fulfilled, (state, { payload }) => {
        const { token, user, serverUser } = payload;
        state.token = token;
        state.name = user.name || serverUser?.name || "";
        state.email = user.email || serverUser?.email || "";
        state._id = user._id || serverUser?._id || "";
        state.isAdmin = user.isAdmin || serverUser?.isAdmin || false;
        state.isBusinessOwner = user.isBusinessOwner || serverUser?.isBusinessOwner || false;
        state.businesses = user.businesses || serverUser?.businesses || [];
        state.role = user.role || serverUser?.role || null;
        state.registrationStep = user.registrationStep || serverUser?.registrationStep || null;
        state.defaultBusiness = user.defaultBusiness || serverUser?.defaultBusiness || null;
        state.isAuthenticated = true;
        state.loginStatus = "success";
        state.loginError = null;
        state.userLoaded = true;
        state.loading = false;
      })
      .addCase(loginWithToken.rejected, (state, { payload }) => {
        state.loginStatus = "failed";
        state.loginError = payload;
        state.isAuthenticated = false;
        state.userLoaded = true;
        state.loading = false;
        state.token = null;
        state.role = null;
        state.registrationStep = null;
        state.defaultBusiness = null;
      })
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.userLoaded = false;
        state.loginError = null;
      })
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        const { token, user } = payload;
        state.token = token;
        state.name = user.name || "";
        state.email = user.email || "";
        state._id = user._id || "";
        state.isAdmin = user.isAdmin || false;
        state.isBusinessOwner = user.isBusinessOwner || false;
        state.businesses = user.businesses || [];
        state.role = user.role || null;
        state.registrationStep = user.registrationStep || null;
        state.defaultBusiness = user.defaultBusiness || null;
        state.isAuthenticated = true;
        state.userLoaded = true;
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.userLoaded = true;
        state.loginError = payload;
      });
  },
});

export const {
  loginUserSuccess,
  logoutUser,
  clearVerification,
  setVerificationEmail,
  resetAuthErrors,
  setAuthFromUserData,
  businessDeleted,
  updateAuthBusiness,
} = authSlice.actions;

export default authSlice.reducer;