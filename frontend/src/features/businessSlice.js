import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  businesses: [],
  defaultBusiness: null,
  stats: [],
  status: "idle",
  error: null,
};

// Create new business
export const createBusiness = createAsyncThunk(
  "businesses/create",
  async (data, { rejectWithValue }) => {
    try {
      console.log("Enviando datos a /api/business:", data);
      console.log("Headers:", setHeaders().headers);
      const response = await axios.post(`${url}/business`, data, setHeaders());
      console.log("Respuesta de /api/business:", response.data);
      return response.data.business;
    } catch (err) {
      console.error(
        "Error en createBusiness:",
        err.response?.data || err.message
      );
      return rejectWithValue(
        err.response?.data || { message: "Error al crear el negocio" }
      );
    }
  }
);

// Fetch all businesses
export const fetchBusinesses = createAsyncThunk(
  "business/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/business`, setHeaders());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update business
export const updateBusiness = createAsyncThunk(
  "business/update",
  async ({ businessId, data }, { rejectWithValue, dispatch }) => {
    try {
      const { ownerId, ...updateData } = data;
      console.log("Enviando actualización de negocio:", { businessId, updateData });
      const response = await axios.patch(
        `${url}/business/${businessId}`,
        updateData,
        setHeaders()
      );
      console.log("Respuesta de actualización:", response.data);
      dispatch(businessUpdated(response.data.business));
      return response.data.business;
    } catch (err) {
      console.error("Error en updateBusiness:", err.response?.data || err.message);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete business
export const deleteBusiness = createAsyncThunk(
  "business/delete",
  async ({ businessId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.delete(`${url}/business/${businessId}`, {
        ...setHeaders(),
        headers: { ...setHeaders().headers, businessId },
      });
      return response.data.data.businessId;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Error al eliminar negocio"
      );
    }
  }
);

// Fetch specific business
export const fetchBusiness = createAsyncThunk(
  "business/fetchBusiness",
  async (businessId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${url}/business/${businessId}`,
        setHeaders()
      );
      return response.data.business;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error al cargar el negocio"
      );
    }
  }
);

// Fetch business stats
export const fetchBusinessStats = createAsyncThunk(
  "business/fetchBusinessStats",
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    if (auth.role !== "owner" || !auth.businesses.length) {
      return [];
    }
    try {
      const response = await axios.get(`${url}/business/statistics`, {
        headers: setHeaders().headers,
      });
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const businessSlice = createSlice({
  name: "business",
  initialState,
  reducers: {
    setDefaultBusiness: (state, action) => {
      state.defaultBusiness = action.payload;
    },
    clearBusinessState: () => initialState,
    businessAdded: (state, action) => {
      const exists = state.businesses.some((b) => b._id === action.payload._id);
      if (!exists) {
        state.businesses.push(action.payload);
      }
    },
    businessUpdated: (state, action) => {
      const index = state.businesses.findIndex(
        (b) => b._id === action.payload._id
      );
      if (index !== -1) {
        state.businesses[index] = action.payload;
      }
      if (state.defaultBusiness?._id === action.payload._id) {
        state.defaultBusiness = action.payload;
      }
    },
    businessDeleted: (state, action) => {
      state.businesses = state.businesses.filter(
        (b) => String(b._id) !== String(action.payload)
      );
      state.stats = state.stats.filter(
        (stat) => stat.businessId !== action.payload
      );
      if (state.defaultBusiness?._id === action.payload) {
        state.defaultBusiness = null;
      }
    },
    updateBusinessStatsFromSocket: (state, action) => {
      const { businessId, event, data } = action.payload;
      console.log("Updating business stats from socket:", { businessId, event, data });
      if (event === "businessDeleted") {
        state.stats = state.stats.filter(
          (stat) => stat.businessId !== businessId
        );
        state.businesses = state.businesses.filter(
          (b) => String(b._id) !== String(businessId)
        );
        if (state.defaultBusiness?._id === businessId) {
          state.defaultBusiness = null;
        }
      } else if (event === "businessCreated") {
        state.businesses.push(data);
      } else if (event === "businessUpdated") {
        const index = state.businesses.findIndex((b) => b._id === businessId);
        if (index !== -1) {
          state.businesses[index] = data;
        }
        if (state.defaultBusiness?._id === businessId) {
          state.defaultBusiness = data;
        }
      } else if (event === "noteCreated") {
        const statIndex = state.stats.findIndex((s) => s.businessId === businessId);
        if (statIndex !== -1) {
          state.stats[statIndex].totalNotes = (state.stats[statIndex].totalNotes || 0) + 1;
          state.stats[statIndex].totalSales = (state.stats[statIndex].totalSales || 0) + (data.total || 0);
          const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
          const monthSale = state.stats[statIndex].monthlySales.find(
            (m) => `${m._id.year}-${m._id.month.toString().padStart(2, "0")}` === currentMonth
          );
          if (monthSale) {
            monthSale.total = (monthSale.total || 0) + (data.total || 0);
            monthSale.count = (monthSale.count || 0) + 1;
          } else {
            state.stats[statIndex].monthlySales.push({
              _id: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
              total: data.total || 0,
              count: 1,
            });
          }
        } else {
          state.stats.push({
            businessId,
            totalNotes: 1,
            totalSales: data.total || 0,
            monthlySales: [{
              _id: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
              total: data.total || 0,
              count: 1,
            }],
          });
        }
      } else if (event === "noteDeleted") {
        const statIndex = state.stats.findIndex((s) => s.businessId === businessId);
        if (statIndex !== -1) {
          state.stats[statIndex].totalNotes = Math.max(0, (state.stats[statIndex].totalNotes || 0) - 1);
          state.stats[statIndex].totalSales = Math.max(0, (state.stats[statIndex].totalSales || 0) - (data.total || 0));
          const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
          const monthSale = state.stats[statIndex].monthlySales.find(
            (m) => `${m._id.year}-${m._id.month.toString().padStart(2, "0")}` === currentMonth
          );
          if (monthSale) {
            monthSale.total = Math.max(0, (monthSale.total || 0) - (data.total || 0));
            monthSale.count = Math.max(0, (monthSale.count || 0) - 1);
          }
        }
      } else if (event === "noteUpdated") {
        const statIndex = state.stats.findIndex((s) => s.businessId === businessId);
        if (statIndex !== -1 && data.previousTotal !== undefined && data.total !== undefined) {
          const totalDiff = data.total - data.previousTotal;
          state.stats[statIndex].totalSales = Math.max(0, (state.stats[statIndex].totalSales || 0) + totalDiff);
          const currentMonth = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, "0")}`;
          const monthSale = state.stats[statIndex].monthlySales.find(
            (m) => `${m._id.year}-${m._id.month.toString().padStart(2, "0")}` === currentMonth
          );
          if (monthSale) {
            monthSale.total = Math.max(0, (monthSale.total || 0) + totalDiff);
          }
        }
      } else if (event === "statsUpdated") {
        if (data.type === "notes") {
          const statIndex = state.stats.findIndex((s) => s.businessId === businessId);
          if (statIndex !== -1) {
            state.stats[statIndex].totalNotes = data.monthStats.reduce((sum, m) => sum + m.count, 0);
            state.stats[statIndex].monthlySales = data.monthStats.map(m => ({
              _id: { year: m._id.year, month: m._id.month },
              total: m.total || 0,
              count: m.count,
            }));
          }
        } else if (data.type === "income") {
          const statIndex = state.stats.findIndex((s) => s.businessId === businessId);
          if (statIndex !== -1) {
            state.stats[statIndex].totalSales = data.incomeStats.reduce((sum, m) => sum + m.total, 0);
            state.stats[statIndex].monthlySales = data.incomeStats.map(m => ({
              _id: { year: m._id.year, month: m._id.month },
              total: m.total,
              count: m.count || 0,
            }));
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBusiness.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createBusiness.fulfilled, (state, action) => {
        state.businesses.push(action.payload);
        state.defaultBusiness = action.payload;
        state.status = "success";
        toast.success("Negocio creado correctamente");
      })
      .addCase(createBusiness.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al crear negocio");
      })
      .addCase(fetchBusinesses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBusinesses.fulfilled, (state, action) => {
        state.businesses = action.payload;
        state.status = "success";
      })
      .addCase(fetchBusinesses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateBusiness.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateBusiness.fulfilled, (state, action) => {
        const index = state.businesses.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.businesses[index] = action.payload;
        }
        if (state.defaultBusiness?._id === action.payload._id) {
          state.defaultBusiness = action.payload;
        }
        state.status = "success";
        toast.success("Negocio actualizado");
      })
      .addCase(updateBusiness.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al actualizar negocio");
      })
      .addCase(deleteBusiness.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteBusiness.fulfilled, (state, action) => {
        const businessId = action.payload;
        state.businesses = state.businesses.filter(
          (b) => String(b._id) !== String(businessId)
        );
        state.stats = state.stats.filter(
          (stat) => stat.businessId !== businessId
        );
        if (state.defaultBusiness?._id === businessId) {
          state.defaultBusiness = null;
        }
        state.status = "success";
      })
      .addCase(deleteBusiness.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(action.payload?.message || "Error al eliminar negocio");
      })
      .addCase(fetchBusiness.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBusiness.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.business = action.payload;
        state.error = null;
      })
      .addCase(fetchBusiness.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchBusinessStats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBusinessStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchBusinessStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        toast.error(
          action.payload?.message || "Error al obtener estadísticas de negocios"
        );
      });
  },
});

export const {
  setDefaultBusiness,
  clearBusinessState,
  businessAdded,
  businessUpdated,
  businessDeleted,
  updateBusinessStatsFromSocket,
} = businessSlice.actions;

export default businessSlice.reducer;