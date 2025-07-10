import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  currentGuest: null,
  currentUser: null, // Nuevo estado para el usuario autenticado
  status: "idle",
  deleteStatus: "idle",
  convertStatus: "idle",
  error: null,
};

// 1. Obtener todos los usuarios (Admin)
export const usersFetch = createAsyncThunk("users/fetchAll", async () => {
  const response = await axios.get(`${url}/users`, setHeaders());
  return response.data.users;
});

// 2. Crear usuario invitado
export const createGuestUser = createAsyncThunk(
  "users/createGuest",
  async (contactInfo, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${url}/users/guest`, contactInfo);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 3. Convertir usuario invitado en cuenta real
export const convertGuestToUser = createAsyncThunk(
  "users/convertGuest",
  async ({ guestId, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${url}/users/convert-guest`, {
        guestId,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 4. Eliminar usuario
export const userDelete = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${url}/users/${id}`, setHeaders());
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar usuario");
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 5. Obtener datos del usuario autenticado
export const fetchUser = createAsyncThunk(
  "users/fetchUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/users/${userId}`, setHeaders());
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 6. Actualizar usuario
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ userId, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${url}/users/${userId}`,
        updates,
        setHeaders()
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setCurrentGuest: (state, action) => {
      state.currentGuest = action.payload;
    },
    clearCurrentGuest: (state) => {
      state.currentGuest = null;
    },
    userUpdated: (state, action) => {
      const index = state.list.findIndex((u) => u._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...action.payload };
      }
      if (state.currentUser?._id === action.payload._id) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    userAdded: (state, action) => {
      const exists = state.list.some((u) => u._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
      }
    },
    userDeleted: (state, action) => {
      state.list = state.list.filter((u) => u._id !== action.payload._id);
      if (state.currentUser?._id === action.payload._id) {
        state.currentUser = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // usersFetch
      .addCase(usersFetch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(usersFetch.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "success";
      })
      .addCase(usersFetch.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // createGuestUser
      .addCase(createGuestUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createGuestUser.fulfilled, (state, action) => {
        state.currentGuest = action.payload;
        state.status = "success";
      })
      .addCase(createGuestUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al crear usuario invitado");
      })
      // convertGuestToUser
      .addCase(convertGuestToUser.pending, (state) => {
        state.convertStatus = "loading";
      })
      .addCase(convertGuestToUser.fulfilled, (state) => {
        state.convertStatus = "success";
        state.currentGuest = null;
        toast.success("¡Cuenta convertida exitosamente!");
      })
      .addCase(convertGuestToUser.rejected, (state, action) => {
        state.convertStatus = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al convertir invitado");
      })
      // userDelete
      .addCase(userDelete.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(userDelete.fulfilled, (state, action) => {
        state.list = state.list.filter((user) => user._id !== action.payload._id);
        state.deleteStatus = "success";
      })
      .addCase(userDelete.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      })
      // fetchUser
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.status = "success";
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al obtener datos del usuario");
      })
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.status = "success";
        toast.success("Usuario actualizado correctamente");
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al actualizar usuario");
      });
  },
});

export const {
  setCurrentGuest,
  clearCurrentGuest,
  userUpdated,
  userDeleted,
  userAdded,
} = usersSlice.actions;

export default usersSlice.reducer;