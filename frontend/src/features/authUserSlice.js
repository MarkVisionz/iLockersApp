import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { url, setHeaders } from './api';
import { toast } from 'react-toastify';

export const fetchAuthUser = createAsyncThunk(
  "auth/fetchAuthUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/users/${userId}`, setHeaders());
      console.log("fetchAuthUser response:", {
        userId: response.data.user?._id,
        businesses: response.data.user?.businesses,
        defaultBusiness: response.data.user?.defaultBusiness,
      });
      return response.data.user;
    } catch (error) {
      console.error("fetchAuthUser error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Error fetching auth user");
    }
  }
);

const authUserSlice = createSlice({
  name: 'authUser',
  initialState: {
    user: null,
    businesses: [],
    loading: false,
    error: null,
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload;
      state.businesses = action.payload?.businesses || [];
      state.loading = false;
      state.error = null;
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.businesses = [];
      state.loading = false;
      state.error = null;
    },
    businessDeleted: (state, action) => {
      const businessId = action.payload;
      state.businesses = state.businesses.filter((b) => String(b._id) !== String(businessId));
      if (state.user && state.user.defaultBusiness === businessId) {
        state.user.defaultBusiness = state.businesses.length > 0 ? state.businesses[0]._id : null;
      }
      state.loading = false;
      state.error = null;
      localStorage.setItem('businesses', JSON.stringify(state.businesses));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuthUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.businesses = action.payload?.businesses || [];
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
        localStorage.setItem('businesses', JSON.stringify(action.payload.businesses || []));
      })
      .addCase(fetchAuthUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase('businesses/create/fulfilled', (state, action) => {
        if (state.user) {
          state.user.businesses = [...(state.user.businesses || []), action.payload._id];
          state.businesses = [...(state.businesses || []), action.payload];
          state.user.defaultBusiness = action.payload._id;
          toast.success("Negocio vinculado al usuario");
        }
      });
  },
});

export const { setAuthUser, clearAuthUser, businessDeleted } = authUserSlice.actions;
export default authUserSlice.reducer;