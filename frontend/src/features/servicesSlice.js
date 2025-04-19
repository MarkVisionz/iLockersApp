// src/features/servicesSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { serviceAPI } from "../services/serviceApi";
import axios from "axios";
import { url, setHeaders } from "./api"; // Asegúrate de que este archivo exista y tenga tu config

// THUNKS
export const fetchServices = createAsyncThunk("services/fetch", async (_, thunkAPI) => {
  try {
    const res = await serviceAPI.fetchServices();
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const createService = createAsyncThunk("services/create", async (data, thunkAPI) => {
  try {
    const res = await serviceAPI.createService(data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const bulkCreateServices = createAsyncThunk(
  "services/bulkCreateServices",
  async (services, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${url}/services/bulk`,
        { services },
        setHeaders()
      );
      return response.data; // Espera que backend devuelva: { success: true, data: [...], count: n }
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateService = createAsyncThunk("services/update", async ({ id, data }, thunkAPI) => {
  try {
    const res = await serviceAPI.updateService(id, data);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const deleteService = createAsyncThunk("services/delete", async (id, thunkAPI) => {
  try {
    await serviceAPI.deleteService(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

export const clearAllServicesThunk = createAsyncThunk("services/clearAll", async (_, thunkAPI) => {
  try {
    await serviceAPI.deleteAllServices();
    return true;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message);
  }
});

// SLICE
const servicesSlice = createSlice({
  name: "services",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    serviceAdded: (state, action) => {
      state.items.push(action.payload);
    },
    serviceUpdated: (state, action) => {
      const index = state.items.findIndex((s) => s._id === action.payload._id);
      if (index !== -1) state.items[index] = action.payload;
    },
    serviceDeleted: (state, action) => {
      state.items = state.items.filter((s) => s._id !== action.payload);
    },
    clearAllServices: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(bulkCreateServices.fulfilled, (state, action) => {
        // backend debe devolver array en action.payload.data
        if (Array.isArray(action.payload.data)) {
          state.items.push(...action.payload.data);
        }
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.items.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
      })
      .addCase(clearAllServicesThunk.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const {
  serviceAdded,
  serviceUpdated,
  serviceDeleted,
  clearAllServices,
} = servicesSlice.actions;

export default servicesSlice.reducer;
