import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  status: null,
  deleteStatus: null,
};

// GET all users
export const usersFetch = createAsyncThunk("users/usersFetch", async () => {
  try {
    const response = await axios.get(`${url}/users`, setHeaders());
    return response.data;
  } catch (error) {
    console.log(error);
  }
});

// DELETE user
export const userDelete = createAsyncThunk("users/userDelete", async (id) => {
  try {
    const response = await axios.delete(`${url}/users/${id}`, setHeaders());
    return response.data;
  } catch (error) {
    console.log(error.response?.data);
    toast.error(error.response?.data, {
      position: "bottom-left",
    });
  }
});

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // ✅ SOCKET.IO reducers
    userUpdated: (state, action) => {
      const index = state.list.findIndex((u) => u._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
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
      .addCase(userDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(userDelete.fulfilled, (state, action) => {
        const newList = state.list.filter(
          (user) => user._id !== action.payload._id
        );
        state.list = newList;
        state.deleteStatus = "success";
        toast.error("User Deleted!", {
          position: "bottom-left",
        });
      })
      .addCase(userDelete.rejected, (state) => {
        state.deleteStatus = "rejected";
      });
  },
});

// ✅ export actions para usar con socket listeners
export const { userUpdated, userDeleted, userAdded } = usersSlice.actions;

export default usersSlice.reducer;
