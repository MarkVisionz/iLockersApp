import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  currentGuest: null,
  status: null,
  deleteStatus: null,
  convertStatus: null,
};

// GET all users
export const usersFetch = createAsyncThunk("users/usersFetch", async () => {
  try {
    const response = await axios.get(`${url}/users`, setHeaders());
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

// CREATE guest user
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

// CONVERT guest to regular user
export const convertGuestToUser = createAsyncThunk(
  "users/convertGuest",
  async ({ guestId, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${url}/users/convert-guest`, { 
        guestId, 
        email, 
        password 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// DELETE user
export const userDelete = createAsyncThunk("users/userDelete", async (id) => {
  try {
    const response = await axios.delete(`${url}/users/${id}`, setHeaders());
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Error al eliminar usuario");
    throw error;
  }
});

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
        state.list[index] = action.payload;
      }
      if (state.currentGuest?._id === action.payload._id) {
        state.currentGuest = action.payload;
      }
    },
    userDeleted: (state, action) => {
      state.list = state.list.filter((u) => u._id !== action.payload._id);
    },
    userAdded: (state, action) => {
      state.list.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(usersFetch.pending, (state) => {
        state.status = "pending";
      })
      .addCase(usersFetch.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "success";
      })
      .addCase(usersFetch.rejected, (state) => {
        state.status = "rejected";
      })
      .addCase(createGuestUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createGuestUser.fulfilled, (state, action) => {
        state.currentGuest = action.payload;
        state.status = "success";
      })
      .addCase(createGuestUser.rejected, (state, action) => {
        state.status = "failed";
        toast.error(action.payload?.message || "Error al crear usuario invitado");
      })
      .addCase(convertGuestToUser.pending, (state) => {
        state.convertStatus = "loading";
      })
      .addCase(convertGuestToUser.fulfilled, (state, action) => {
        state.convertStatus = "success";
        state.currentGuest = null;
        toast.success("¡Cuenta convertida a usuario regular!");
      })
      .addCase(convertGuestToUser.rejected, (state, action) => {
        state.convertStatus = "failed";
        toast.error(action.payload?.message || "Error al convertir usuario");
      })
      .addCase(userDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(userDelete.fulfilled, (state, action) => {
        const newList = state.list.filter(
          (user) => user._id !== action.payload._id
        );
        state.list = newList;
        state.deleteStatus = "success";
      })
      .addCase(userDelete.rejected, (state) => {
        state.deleteStatus = "rejected";
      });
  },
});

export const { 
  setCurrentGuest,
  clearCurrentGuest,
  userUpdated, 
  userDeleted, 
  userAdded 
} = usersSlice.actions;

export default usersSlice.reducer;