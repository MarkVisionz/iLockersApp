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
  guestOrders: [],
  currentOrder: null,
};

const handleError = (error, rejectWithValue) => {
  const message =
    error.response?.data?.message || error.message || "Error desconocido";
  toast.error(message);
  return rejectWithValue(message);
};

// Thunks para operaciones asíncronas
export const createGuestOrder = createAsyncThunk(
  "orders/createGuestOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${url}/orders`, orderData);
      toast.success("Orden creada exitosamente");
      return res.data;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

export const fetchGuestOrders = createAsyncThunk(
  "orders/fetchGuestOrders",
  async (guestId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${url}/orders/guest/${guestId}`);
      return res.data;
    } catch (error) {
      return handleError(error, rejectWithValue);
    }
  }
);

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
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearGuestOrders: (state) => {
      state.guestOrders = [];
    },
    socketOrderAdded: (state, action) => {
      const exists = state.list.some((o) => o._id === action.payload._id);
      if (!exists) {
        state.list.unshift(action.payload);
      }
      if (action.payload.isGuestOrder) {
        state.guestOrders.unshift(action.payload);
      }
    },
    socketOrderUpdated: (state, action) => {
      const index = state.list.findIndex((o) => o._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
      const guestIndex = state.guestOrders.findIndex(
        (o) => o._id === action.payload._id
      );
      if (guestIndex !== -1) {
        state.guestOrders[guestIndex] = action.payload;
      }
    },
    socketOrderStatusChanged: (state, action) => {
      const order = state.list.find((o) => o._id === action.payload._id);
      if (order) {
        order.delivery_status = action.payload.status;
      }
      const guestOrder = state.guestOrders.find(
        (o) => o._id === action.payload._id
      );
      if (guestOrder) {
        guestOrder.delivery_status = action.payload.status;
      }
    },
    socketStatsUpdated: (state, action) => {
      const { type, data } = action.payload;
      state.stats[type] = data;
      state.stats.loading = false;
    },
    invalidateOrdersCache: (state) => {
      state.status = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGuestOrder.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createGuestOrder.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.guestOrders.unshift(action.payload);
        state.status = "succeeded";
      })
      .addCase(createGuestOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGuestOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGuestOrders.fulfilled, (state, action) => {
        state.guestOrders = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchGuestOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
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
        const index = state.list.findIndex((o) => o._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        const guestIndex = state.guestOrders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (guestIndex !== -1) {
          state.guestOrders[guestIndex] = action.payload;
        }
      })
      .addCase(ordersDelete.fulfilled, (state, action) => {
        const order = state.list.find((o) => o._id === action.payload._id);
        if (order) {
          order.delivery_status = "cancelled";
        }
        const guestOrder = state.guestOrders.find(
          (o) => o._id === action.payload._id
        );
        if (guestOrder) {
          guestOrder.delivery_status = "cancelled";
        }
      })
      .addMatcher(
        (action) =>
          [
            fetchOrderStats.pending.type,
            fetchIncomeStats.pending.type,
            fetchWeekSales.pending.type,
          ].includes(action.type),
        (state) => {
          state.stats.loading = true;
          state.stats.error = null;
        }
      )
      .addMatcher(
        (action) =>
          [
            fetchOrderStats.fulfilled.type,
            fetchIncomeStats.fulfilled.type,
            fetchWeekSales.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          state.stats[action.payload.type] = action.payload.data;
          state.stats.loading = false;
        }
      )
      .addMatcher(
        (action) =>
          [
            fetchOrderStats.rejected.type,
            fetchIncomeStats.rejected.type,
            fetchWeekSales.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.stats.loading = false;
          state.stats.error = action.payload;
        }
      );
  },
});

export const {
  setCurrentOrder,
  clearGuestOrders,
  socketOrderAdded,
  socketOrderUpdated,
  socketOrderStatusChanged,
  socketStatsUpdated,
  invalidateOrdersCache,
} = ordersSlice.actions;

export default ordersSlice.reducer;
