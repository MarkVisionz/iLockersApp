import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  status: "idle",
  error: null,
  stats: {
    orders: [],
    income: [],
    weekly: [],
    status: "idle",
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

// Thunks
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
      const res = await axios.delete(`${url}/orders/${id}`, setHeaders());
      toast.info("Orden eliminada correctamente");
      return { _id: id };
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
      const newOrder = action.payload;
      const orderId = String(newOrder._id);
      const exists = state.list.some((o) => String(o._id) === orderId);
      if (!exists) {
        state.list.unshift(newOrder);
      }
      if (newOrder.isGuestOrder) {
        const guestExists = state.guestOrders.some((o) => String(o._id) === orderId);
        if (!guestExists) {
          state.guestOrders.unshift(newOrder);
        }
      }
    },
    socketOrderUpdated: (state, action) => {
      const updatedOrder = action.payload;
      const orderId = String(updatedOrder._id);
      const index = state.list.findIndex((o) => String(o._id) === orderId);
      if (index !== -1) {
        state.list[index] = updatedOrder;
      }
      const guestIndex = state.guestOrders.findIndex(
        (o) => String(o._id) === orderId
      );
      if (guestIndex !== -1) {
        state.guestOrders[guestIndex] = updatedOrder;
      }
    },
    socketOrderStatusChanged: (state, action) => {
      const { _id, status } = action.payload;
      const orderId = String(_id);
      const order = state.list.find((o) => String(o._id) === orderId);
      if (order) {
        order.delivery_status = status;
      }
      const guestOrder = state.guestOrders.find(
        (o) => String(o._id) === orderId
      );
      if (guestOrder) {
        guestOrder.delivery_status = status;
      }
    },
    socketOrderDeleted: (state, action) => {
      const orderId = String(action.payload._id);
      state.list = state.list.filter((o) => String(o._id) !== orderId);
      state.guestOrders = state.guestOrders.filter((o) => String(o._id) !== orderId);
    },
    socketStatsUpdated: (state, action) => {
      const { type, data } = action.payload;
      state.stats[type] = data;
      state.stats.status = "succeeded";
    },
    invalidateOrdersCache: (state) => {
      state.status = "idle";
    },
    resetError: (state) => {
      state.error = null;
      state.stats.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGuestOrder.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createGuestOrder.fulfilled, (state, action) => {
        const orderId = String(action.payload._id);
        const exists = state.list.some((o) => String(o._id) === orderId);
        if (!exists) {
          state.list.unshift(action.payload);
        }
        const guestExists = state.guestOrders.some((o) => String(o._id) === orderId);
        if (!guestExists) {
          state.guestOrders.unshift(action.payload);
        }
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(createGuestOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchGuestOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGuestOrders.fulfilled, (state, action) => {
        const uniqueOrders = [];
        const seenIds = new Set();
        for (const order of action.payload) {
          const orderId = String(order._id);
          if (!seenIds.has(orderId)) {
            seenIds.add(orderId);
            uniqueOrders.push(order);
          }
        }
        state.guestOrders = uniqueOrders;
        state.status = "succeeded";
        state.error = null;
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
        const uniqueOrders = [];
        const seenIds = new Set();
        for (const order of action.payload) {
          const orderId = String(order._id);
          if (!seenIds.has(orderId)) {
            seenIds.add(orderId);
            uniqueOrders.push(order);
          }
        }
        state.list = uniqueOrders;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(ordersFetch.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(ordersEdit.fulfilled, (state, action) => {
        const orderId = String(action.payload._id);
        const index = state.list.findIndex((o) => String(o._id) === orderId);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        const guestIndex = state.guestOrders.findIndex(
          (o) => String(o._id) === orderId
        );
        if (guestIndex !== -1) {
          state.guestOrders[guestIndex] = action.payload;
        }
        state.error = null;
      })
      .addCase(ordersDelete.pending, (state) => {
        state.status = "loading";
      })
      .addCase(ordersDelete.fulfilled, (state, action) => {
        const orderId = String(action.payload._id);
        state.list = state.list.filter((o) => String(o._id) !== orderId);
        state.guestOrders = state.guestOrders.filter((o) => String(o._id) !== orderId);
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(ordersDelete.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addMatcher(
        (action) =>
          [
            fetchOrderStats.pending.type,
            fetchIncomeStats.pending.type,
            fetchWeekSales.pending.type,
          ].includes(action.type),
        (state) => {
          state.stats.status = "loading";
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
          state.stats.status = "succeeded";
          state.stats.error = null;
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
          state.stats.status = "failed";
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
  socketOrderDeleted,
  socketStatsUpdated,
  invalidateOrdersCache,
  resetError,
} = ordersSlice.actions;

export default ordersSlice.reducer;