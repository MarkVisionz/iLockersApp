import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  status: null,
  error: null,
  stats: {
    orders: [],
    income: [],
    weekly: [],
    loading: false,
    error: null,
  },
};

const handleError = (error, rejectWithValue) => {
  const message = error.response?.data?.message || error.message || "Error desconocido";
  toast.error(message);
  return rejectWithValue(message);
};

// Thunks para operaciones asíncronas
export const ordersFetch = createAsyncThunk(
  "orders/ordersFetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${url}/orders`, setHeaders());
      return res.data;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const fetchOrderStats = createAsyncThunk(
  "orders/fetchOrderStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${url}/orders/stats`, setHeaders());
      return { type: "orders", data: res.data };
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const fetchIncomeStats = createAsyncThunk(
  "orders/fetchIncomeStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${url}/orders/income/stats`, setHeaders());
      return { type: "income", data: res.data };
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const fetchWeekSales = createAsyncThunk(
  "orders/fetchWeekSales",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${url}/orders/week-sales`, setHeaders());
      return { type: "weekly", data: res.data };
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const ordersEdit = createAsyncThunk(
  "orders/ordersEdit",
  async (values, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${url}/orders/${values.id}`,
        { delivery_status: values.delivery_status },
        setHeaders()
      );
      toast.success("Orden actualizada correctamente");
      return res.data;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const ordersDelete = createAsyncThunk(
  "orders/ordersDelete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${url}/orders/${id}`,
        { delivery_status: "cancelled" },
        setHeaders()
      );
      toast.info("Orden cancelada correctamente");
      return res.data;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Reducers para actualizaciones via socket
    socketOrderAdded: (state, action) => {
      const exists = state.list.some(o => o._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
      }
    },
    socketOrderUpdated: (state, action) => {
      const index = state.list.findIndex(o => o._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    socketOrderStatusChanged: (state, action) => {
      const order = state.list.find(o => o._id === action.payload._id);
      if (order) {
        order.delivery_status = action.payload.status;
      }
    },
    socketStatsUpdated: (state, action) => {
      const { type, data } = action.payload;
      state.stats[type] = data;
      state.stats.loading = false;
    },
    // Reducer para forzar recarga de datos
    invalidateOrdersCache: (state) => {
      state.status = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(ordersFetch.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(ordersFetch.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "succeeded";
      })
      .addCase(ordersFetch.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(ordersEdit.fulfilled, (state, action) => {
        const index = state.list.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(ordersDelete.fulfilled, (state, action) => {
        const order = state.list.find(o => o._id === action.payload._id);
        if (order) {
          order.delivery_status = "cancelled";
        }
      })
      .addMatcher(
        action => [
          fetchOrderStats.pending.type,
          fetchIncomeStats.pending.type,
          fetchWeekSales.pending.type
        ].includes(action.type),
        (state) => {
          state.stats.loading = true;
          state.stats.error = null;
        }
      )
      .addMatcher(
        action => [
          fetchOrderStats.fulfilled.type,
          fetchIncomeStats.fulfilled.type,
          fetchWeekSales.fulfilled.type
        ].includes(action.type),
        (state, action) => {
          state.stats[action.payload.type] = action.payload.data;
          state.stats.loading = false;
        }
      )
      .addMatcher(
        action => [
          fetchOrderStats.rejected.type,
          fetchIncomeStats.rejected.type,
          fetchWeekSales.rejected.type
        ].includes(action.type),
        (state, action) => {
          state.stats.loading = false;
          state.stats.error = action.payload;
        }
      );
  }
});

export const { 
  socketOrderAdded,
  socketOrderUpdated,
  socketOrderStatusChanged,
  socketStatsUpdated,
  invalidateOrdersCache
} = ordersSlice.actions;

export default ordersSlice.reducer;