import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { url } from "./api";

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
};

// REGISTER
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (user, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${url}/register`, user);
      const { token } = res.data;

      localStorage.setItem("token", token);
      return token;
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        errorData?.errors || { message: errorData?.message || "Error en el registro" }
      );
    }
  }
);

// LOGIN
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (user, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${url}/login`, user);
      const { token } = res.data;

      localStorage.setItem("token", token);
      return token;
    } catch (err) {
      const errorData = err.response?.data;
      return rejectWithValue(
        errorData?.errors || { message: errorData?.message || "Error al iniciar sesión" }
      );
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
          isAdmin: user.isAdmin || user.role === "admin",
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
    // REGISTER
    builder
      .addCase(registerUser.pending, (state) => {
        state.registerStatus = "pending";
        state.registerError = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const user = jwtDecode(action.payload);
        state.token = action.payload;
        state.name = user.name;
        state.email = user.email;
        state._id = user._id;
        state.isAdmin = user.isAdmin || user.role === "admin";
        state.registerStatus = "success";
        state.registerError = "";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registerStatus = "rejected";
        state.registerError = action.payload;
      });

    // LOGIN
    builder
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
        state.isAdmin = user.isAdmin || user.role === "admin";
        state.loginStatus = "success";
        state.loginError = "";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = "rejected";
        state.loginError = action.payload;
      });
  },
});

export const { loadUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;
