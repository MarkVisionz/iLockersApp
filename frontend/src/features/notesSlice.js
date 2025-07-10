import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setHeaders, url } from "./api";
import { toast } from "react-toastify";

const initialState = {
  items: [],
  currentNote: null,
  stats: { notes: [], income: [] },
  status: "idle",
  statsStatus: "idle",
  fetchNoteStatus: "idle",
  createStatus: "idle",
  editStatus: "idle",
  deleteStatus: "idle",
  error: null,
};

export const notesFetch = createAsyncThunk(
  "notes/notesFetch",
  async ({ businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue("No hay token de autenticación");
      }
      console.log("Enviando solicitud de notas con businessId:", businessId);
      const response = await axios.get(`${url}/notes`, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId,
        },
      });
      console.log("Notas recibidas para businessId:", businessId, response.data);
      return response.data.data || [];
    } catch (error) {
      const message = error.response?.data?.message || "Error al obtener notas";
      console.error("Error en notesFetch:", {
        message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchNoteById = createAsyncThunk(
  "notes/fetchNoteById",
  async ({ id, businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      const response = await axios.get(`${url}/notes/${id}`, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId,
        },
      });
      console.log("Nota recibida:", response.data);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Error al obtener nota";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const notesCreate = createAsyncThunk(
  "notes/notesCreate",
  async (values, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      const response = await axios.post(`${url}/notes`, values, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId: values.businessId,
        },
      });
      console.log("Nota creada:", response.data);
      dispatch(notesFetch({ businessId: values.businessId })); // Recargar notas
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Error al crear nota";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const notesEdit = createAsyncThunk(
  "notes/notesEdit",
  async (values, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      let endpoint = `${url}/notes/${values._id}`;
      if (values.note_status || values.abonos) {
        endpoint = `${url}/notes/${values._id}/payment`;
      } else if (values.cleaning_status && !values.note_status && !values.abonos) {
        endpoint = `${url}/notes/${values._id}/cleaning-status`;
      }
      console.log(`Solicitando actualización en endpoint: ${endpoint}`, values);
      const response = await axios.put(endpoint, values, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId: values.businessId,
        },
      });
      console.log("Nota actualizada:", response.data);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Error al actualizar nota";
      console.error('Error en notesEdit:', {
        message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const notesDelete = createAsyncThunk(
  "notes/notesDelete",
  async ({ id, businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      const response = await axios.delete(`${url}/notes/${id}`, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId,
        },
      });
      console.log("Nota eliminada:", response.data);
      return response.data.data || { _id: id };
    } catch (error) {
      const message = error.response?.data?.message || "Error al eliminar nota";
      console.error('Error en notesDelete:', {
        message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchNotesStats = createAsyncThunk(
  "notes/fetchNotesStats",
  async ({ businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      console.log('Solicitando estadísticas para businessId:', businessId);
      const response = await axios.get(`${url}/notes/stats/month`, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId,
        },
      });
      console.log("Estadísticas recibidas:", response.data);
      return response.data.data || [];
    } catch (error) {
      const message = error.response?.data?.message || "Error al obtener estadísticas";
      console.error('Error en fetchNotesStats:', message);
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchIncomeStats = createAsyncThunk(
  "notes/fetchIncomeStats",
  async ({ businessId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        return rejectWithValue('No hay token de autenticación');
      }
      console.log('Solicitando ingresos para businessId:', businessId);
      const response = await axios.get(`${url}/notes/stats/income`, {
        ...setHeaders(),
        headers: {
          ...setHeaders().headers,
          businessId,
        },
      });
      console.log("Ingresos recibidos:", response.data);
      return response.data.data || [];
    } catch (error) {
      const message = error.response?.data?.message || "Error al obtener ingresos";
      console.error('Error en fetchIncomeStats:', message);
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    noteAdded: (state, action) => {
      const newNote = action.payload;
      const id = String(newNote._id);
      const exists = state.items.some((note) => String(note._id) === id);
      if (!exists) {
        state.items = [newNote, ...state.items];
      }
    },
    noteUpdated: (state, action) => {
      const updated = action.payload;
      state.items = state.items.map((n) =>
        String(n._id) === String(updated._id) ? updated : n
      );
      if (state.currentNote?._id === updated._id) {
        state.currentNote = updated;
      }
    },
    noteDeleted: (state, action) => {
      const id = String(action.payload._id);
      state.items = state.items.filter((n) => String(n._id) !== id);
      if (state.currentNote?._id === id) {
        state.currentNote = null;
      }
    },
    updateStats: (state, action) => {
      const { type, data } = action.payload;
      if (type === "notes") state.stats.notes = data;
      if (type === "income") state.stats.income = data;
      state.statsStatus = "success";
    },
    resetError: (state) => {
      state.error = null;
      state.status = "idle";
      state.statsStatus = "idle";
      state.fetchNoteStatus = "idle";
      state.createStatus = "idle";
      state.editStatus = "idle";
      state.deleteStatus = "idle";
    },
    resetNotes: (state) => {
      state.items = [];
      state.currentNote = null;
      state.stats = { notes: [], income: [] };
      state.status = "idle";
      state.statsStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(notesFetch.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(notesFetch.fulfilled, (state, action) => {
        state.status = "success";
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(notesFetch.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload;
      })
      .addCase(fetchNoteById.pending, (state) => {
        state.fetchNoteStatus = "pending";
        state.error = null;
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.fetchNoteStatus = "success";
        state.currentNote = action.payload;
        state.error = null;
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.fetchNoteStatus = "rejected";
        state.error = action.payload;
      })
      .addCase(notesCreate.pending, (state) => {
        state.createStatus = "pending";
        state.error = null;
      })
      .addCase(notesCreate.fulfilled, (state, action) => {
        state.createStatus = "success";
        state.error = null;
      })
      .addCase(notesCreate.rejected, (state, action) => {
        state.createStatus = "rejected";
        state.error = action.payload;
      })
      .addCase(notesEdit.pending, (state, action) => {
        state.editStatus = "pending";
        const { _id, cleaning_status, note_status } = action.meta.arg;
        if (cleaning_status) {
          state.items = state.items.map((note) =>
            String(note._id) === String(_id) ? { ...note, cleaning_status } : note
          );
        }
        if (note_status) {
          state.items = state.items.map((note) =>
            String(note._id) === String(_id) ? { ...note, note_status } : note
          );
        }
        state.error = null;
      })
      .addCase(notesEdit.fulfilled, (state, action) => {
        state.editStatus = "success";
        const updatedNote = action.payload;
        state.items = state.items.map((n) =>
          String(n._id) === String(updatedNote._id) ? updatedNote : n
        );
        if (state.currentNote?._id === updatedNote._id) {
          state.currentNote = updatedNote;
        }
        state.error = null;
      })
      .addCase(notesEdit.rejected, (state, action) => {
        state.editStatus = "rejected";
        state.error = action.payload;
      })
      .addCase(notesDelete.pending, (state) => {
        state.deleteStatus = "pending";
        state.error = null;
      })
      .addCase(notesDelete.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        const id = String(action.payload._id || action.meta.arg.id);
        state.items = state.items.filter((note) => String(note._id) !== id);
        if (state.currentNote?._id === id) {
          state.currentNote = null;
        }
        state.error = null;
      })
      .addCase(notesDelete.rejected, (state, action) => {
        state.deleteStatus = "rejected";
        state.error = action.payload;
      })
      .addCase(fetchNotesStats.pending, (state) => {
        state.statsStatus = "pending";
        state.error = null;
      })
      .addCase(fetchNotesStats.fulfilled, (state, action) => {
        state.statsStatus = "success";
        state.stats.notes = action.payload || [];
        state.error = null;
      })
      .addCase(fetchNotesStats.rejected, (state, action) => {
        state.statsStatus = "rejected";
        state.error = action.payload;
      })
      .addCase(fetchIncomeStats.pending, (state) => {
        state.statsStatus = "pending";
        state.error = null;
      })
      .addCase(fetchIncomeStats.fulfilled, (state, action) => {
        state.statsStatus = "success";
        state.stats.income = action.payload || [];
        state.error = null;
      })
      .addCase(fetchIncomeStats.rejected, (state, action) => {
        state.statsStatus = "rejected";
        state.error = action.payload;
      });
  },
});

export const {
  noteAdded,
  noteUpdated,
  noteDeleted,
  updateStats,
  resetError,
  resetNotes,
} = notesSlice.actions;

export default notesSlice.reducer;