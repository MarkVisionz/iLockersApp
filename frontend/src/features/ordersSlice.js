import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

// Estado inicial
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

// Utilidad para manejar errores
const handleError = (error, rejectWithValue) => {
  const message = error.response?.data?.message || error.message || "Error desconocido";
  toast.error(message);
  return rejectWithValue(message);
};

// Obtener todas las órdenes
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

// Obtener estadísticas de órdenes
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

// Obtener estadísticas de ingresos
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

// Obtener ventas semanales
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

// Editar una orden (cambiar estado)
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

// Cancelar una orden
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

// Slice
const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    orderAdded: (state, action) => {
      const exists = state.list.find(o => o._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
      }
    },
    orderUpdated: (state, action) => {
      state.list = state.list.map(order =>
        order._id === action.payload._id ? action.payload : order
      );
    },
    orderDeleted: (state, action) => {
      state.list = state.list.map(order =>
        order._id === action.payload._id
          ? { ...order, delivery_status: "cancelled" }
          : order
      );
    },
    updateStatsFromSocket: (state, action) => {
      const { type, data } = action.payload;
      state.stats[type] = data;
    },
    updateStats: (state, action) => {
      const { type, data } = action.payload;
      state.stats[type] = data;
      state.stats.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Orders
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

      // Orders Edit
      .addCase(ordersEdit.fulfilled, (state, action) => {
        state.list = state.list.map(order =>
          order._id === action.payload._id ? action.payload : order
        );
      })

      // Orders Delete (cancelación)
      .addCase(ordersDelete.fulfilled, (state, action) => {
        state.list = state.list.map(order =>
          order._id === action.payload._id
            ? { ...order, delivery_status: "cancelled" }
            : order
        );
      })

      // Stats loading
      .addMatcher(
        action =>
          action.type === fetchOrderStats.pending.type ||
          action.type === fetchIncomeStats.pending.type ||
          action.type === fetchWeekSales.pending.type,
        (state) => {
          state.stats.loading = true;
          state.stats.error = null;
        }
      )

      // Stats fulfilled
      .addMatcher(
        action =>
          action.type === fetchOrderStats.fulfilled.type ||
          action.type === fetchIncomeStats.fulfilled.type ||
          action.type === fetchWeekSales.fulfilled.type,
        (state, action) => {
          const { type, data } = action.payload;
          state.stats[type] = data;
          state.stats.loading = false;
        }
      )

      // Stats rejected
      .addMatcher(
        action =>
          action.type === fetchOrderStats.rejected.type ||
          action.type === fetchIncomeStats.rejected.type ||
          action.type === fetchWeekSales.rejected.type,
        (state, action) => {
          state.stats.loading = false;
          state.stats.error = action.payload;
        }
      );
  },
});

// Exportar acciones
export const {
  orderAdded,
  orderUpdated,
  orderDeleted,
  updateStatsFromSocket,
  updateStats
} = ordersSlice.actions;

export default ordersSlice.reducer;
