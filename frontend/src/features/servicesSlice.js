import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { serviceAPI } from "../services/serviceApi";

// Estado inicial
const initialState = {
  items: [],
  status: "idle",
  createStatus: null,
  updateStatus: null,
  deleteStatus: null,
  bulkStatus: null,
  clearStatus: null,
  error: null,
};

// Obtener servicios por negocio
export const fetchServices = createAsyncThunk(
  "services/fetch",
  async ({ businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue("No hay token de autenticación");
      }
      console.log("Obteniendo servicios para businessId:", businessId);
      const response = await serviceAPI.fetchServices({ businessId });
      console.log("Servicios recibidos para businessId:", businessId, response.data);
      return response.data || response;
    } catch (err) {
      const message = err.message || "Failed to fetch services";
      console.error("Error en fetchServices:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Crear un nuevo servicio
export const createService = createAsyncThunk(
  "services/create",
  async ({ data, businessId }, { rejectWithValue, dispatch }) => {
    try {
      console.log("Creando servicio:", { data, businessId });
      const response = await serviceAPI.createService({ ...data, businessId });
      dispatch(fetchServices({ businessId })); // Recargar servicios
      return response.data || response;
    } catch (err) {
      const message = err.message || "Failed to create service";
      console.error("Error en createService:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Crear múltiples servicios en bulk
export const bulkCreateServices = createAsyncThunk(
  "services/bulkCreateServices",
  async ({ services, businessId }, { rejectWithValue, dispatch }) => {
    try {
      console.log("Creando servicios en masa:", { services, businessId });
      const response = await serviceAPI.bulkCreateServices({ services, businessId });
      dispatch(fetchServices({ businessId })); // Recargar servicios
      return response.data || response;
    } catch (err) {
      const message = err.message || "Failed to create services";
      console.error("Error en bulkCreateServices:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Actualizar un servicio
export const updateService = createAsyncThunk(
  "services/update",
  async ({ id, data, businessId }, { rejectWithValue }) => {
    try {
      console.log("Actualizando servicio:", { id, data, businessId });
      const response = await serviceAPI.updateService(id, { ...data, businessId });
      return response.data || response;
    } catch (err) {
      const message = err.message || "Failed to update service";
      console.error("Error en updateService:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Eliminar un servicio
export const deleteService = createAsyncThunk(
  "services/delete",
  async ({ id, businessId }, { rejectWithValue }) => {
    try {
      console.log("Eliminando servicio:", { id, businessId });
      await serviceAPI.deleteService({ id, businessId });
      return id;
    } catch (err) {
      const message = err.message || "Failed to delete service";
      console.error("Error en deleteService:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Borrar todos los servicios del negocio
export const clearAllServicesThunk = createAsyncThunk(
  "services/clearAll",
  async ({ businessId }, { rejectWithValue }) => {
    try {
      console.log("Eliminando todos los servicios para businessId:", businessId);
      await serviceAPI.deleteAllServices(businessId);
      return true;
    } catch (err) {
      const message = err.message || "Failed to clear services";
      console.error("Error en clearAllServicesThunk:", {
        message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Slice principal
const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    resetServices: (state) => {
      state.items = [];
      state.status = "idle";
      state.createStatus = null;
      state.updateStatus = null;
      state.deleteStatus = null;
      state.bulkStatus = null;
      state.clearStatus = null;
      state.error = null;
    },
    serviceAdded: (state, action) => {
      const newService = action.payload;
      const id = String(newService._id);
      const exists = state.items.some((service) => String(service._id) === id);
      if (!exists) {
        state.items = [newService, ...state.items];
      }
    },
    serviceUpdated: (state, action) => {
      const updated = action.payload;
      state.items = state.items.map((s) =>
        String(s._id) === String(updated._id) ? updated : s
      );
    },
    serviceDeleted: (state, action) => {
      const id = String(action.payload);
      state.items = state.items.filter((s) => String(s._id) !== id);
    },
    clearAllServices: (state) => {
      state.items = [];
      state.clearStatus = "succeeded";
    },
    resetUpdateStatus: (state) => {
      state.updateStatus = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createService.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        // No agregar el servicio aquí; fetchServices lo manejará
        state.error = null;
      })
      .addCase(createService.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload;
      })
      .addCase(bulkCreateServices.pending, (state) => {
        state.bulkStatus = "loading";
        state.error = null;
      })
      .addCase(bulkCreateServices.fulfilled, (state, action) => {
        state.bulkStatus = "succeeded";
        // No agregar servicios aquí; fetchServices lo manejará
        state.error = null;
      })
      .addCase(bulkCreateServices.rejected, (state, action) => {
        state.bulkStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateService.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const updated = action.payload;
        state.items = state.items.map((s) =>
          String(s._id) === String(updated._id) ? updated : s
        );
        state.error = null;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload;
      })
      .addCase(deleteService.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const id = String(action.payload);
        state.items = state.items.filter((s) => String(s._id) !== id);
        state.error = null;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload;
      })
      .addCase(clearAllServicesThunk.pending, (state) => {
        state.clearStatus = "loading";
        state.error = null;
      })
      .addCase(clearAllServicesThunk.fulfilled, (state) => {
        state.clearStatus = "succeeded";
        state.items = [];
        state.error = null;
      })
      .addCase(clearAllServicesThunk.rejected, (state, action) => {
        state.clearStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const {
  resetServices,
  serviceAdded,
  serviceUpdated,
  serviceDeleted,
  clearAllServices,
  resetUpdateStatus,
} = servicesSlice.actions;

export default servicesSlice.reducer;