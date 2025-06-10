import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setHeaders, url } from "./api";
import { toast } from "react-toastify";

const initialState = {
  items: [],
  currentNote: null,
  stats: {
    notes: [],
    income: [],
  },
  status: null,
  statsStatus: null,
  fetchNoteStatus: null,
  createStatus: null,
  editStatus: null,
  deleteStatus: null,
  error: null,
};

// Async Thunks
const notesFetch = createAsyncThunk("notes/notesFetch", async () => {
  try {
    const response = await axios.get(`${url}/notes`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

const fetchNoteById = createAsyncThunk("notes/fetchNoteById", async (id) => {
  try {
    const response = await axios.get(
      `${url}/notes/findOne/${id}`,
      setHeaders()
    );
    return response.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data || "Failed to fetch note");
    throw error;
  }
});

const notesCreate = createAsyncThunk("notes/notesCreate", async (values) => {
  try {
    const response = await axios.post(`${url}/notes`, values, setHeaders());
    return response.data;
  } catch (error) {
    console.log("Error details:", error.response);
    toast.error(error.response?.data.message || "An error occurred");
    throw error;
  }
});

const notesEdit = createAsyncThunk("notes/notesEdit", async (values) => {
  try {
    const response = await axios.put(
      `${url}/notes/${values._id}`,
      values,
      setHeaders()
    );
    return response.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data.message || "Failed to update note");
    throw error;
  }
});

const notesDelete = createAsyncThunk("notes/notesDelete", async (id) => {
  try {
    const response = await axios.delete(`${url}/notes/${id}`, setHeaders());
    return response.data;
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data.message || "Failed to delete note");
    throw error;
  }
});

const fetchNotesStats = createAsyncThunk("notes/fetchNotesStats", async () => {
  try {
    const response = await axios.get(`${url}/notes/stats`, setHeaders());
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
});

const fetchIncomeStats = createAsyncThunk(
  "notes/fetchIncomeStats",
  async () => {
    try {
      const response = await axios.get(
        `${url}/notes/income/stats`,
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

// Slice
const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    noteAdded: (state, action) => {
      const newNote = action.payload;
      const newNoteId = String(newNote._id);
      const existingIndex = state.items.findIndex(
        (note) => String(note._id) === newNoteId
      );
      if (existingIndex === -1) {
        state.items.push(newNote);
      } else {
        state.items[existingIndex] = newNote;
      }
    },
    noteUpdated: (state, action) => {
      const updatedNote = action.payload;
      state.items = state.items.map((note) =>
        String(note._id) === String(updatedNote._id) ? updatedNote : note
      );
      if (state.currentNote?._id === updatedNote._id) {
        state.currentNote = updatedNote;
      }
    },
    noteDeleted: (state, action) => {
      state.items = state.items.filter(
        (note) => String(note._id) !== String(action.payload._id)
      );
      if (state.currentNote?._id === action.payload._id) {
        state.currentNote = null;
      }
    },
    updateStats: (state, action) => {
      const { type, data } = action.payload;
      if (type === "notes") {
        state.stats.notes = data;
      } else if (type === "income") {
        state.stats.income = data;
      }
      state.statsStatus = "success";
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // notesFetch
      .addCase(notesFetch.pending, (state) => {
        state.status = "pending";
      })
      .addCase(notesFetch.fulfilled, (state, action) => {
        state.status = "success";
        const uniqueNotes = [];
        const seenIds = new Set();
        for (const note of action.payload) {
          const noteId = String(note._id);
          if (!seenIds.has(noteId)) {
            seenIds.add(noteId);
            uniqueNotes.push(note);
          }
        }
        state.items = uniqueNotes;
      })
      .addCase(notesFetch.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
        toast.error("Failed to fetch notes");
      })
      // fetchNoteById
      .addCase(fetchNoteById.pending, (state) => {
        state.fetchNoteStatus = "pending";
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.fetchNoteStatus = "success";
        state.currentNote = action.payload;
        const noteId = String(action.payload._id);
        const existingIndex = state.items.findIndex(
          (note) => String(note._id) === noteId
        );
        if (existingIndex === -1) {
          state.items.push(action.payload);
        } else {
          state.items[existingIndex] = action.payload;
        }
      })
      .addCase(fetchNoteById.rejected, (state, action) => {
        state.fetchNoteStatus = "rejected";
        state.error = action.error.message;
      })
      // notesCreate
      .addCase(notesCreate.pending, (state) => {
        state.createStatus = "pending";
      })
      .addCase(notesCreate.fulfilled, (state, action) => {
        state.createStatus = "success";
        const noteId = String(action.payload._id);
        const existingIndex = state.items.findIndex(
          (note) => String(note._id) === noteId
        );
        if (existingIndex === -1) {
          state.items.push(action.payload);
        } else {
          state.items[existingIndex] = action.payload;
        }
      })
      .addCase(notesCreate.rejected, (state) => {
        state.createStatus = "rejected";
      })
      // notesEdit
      .addCase(notesEdit.pending, (state, action) => {
        state.editStatus = "pending";
        const { _id, cleaning_status } = action.meta.arg;
        state.items = state.items.map((note) =>
          String(note._id) === String(_id)
            ? { ...note, cleaning_status }
            : note
        );
      })
      .addCase(notesEdit.fulfilled, (state, action) => {
        state.editStatus = "success";
        const updatedNote = action.payload;
        state.items = state.items.map((note) =>
          String(note._id) === String(updatedNote._id) ? updatedNote : note
        );
        if (state.currentNote?._id === updatedNote._id) {
          state.currentNote = updatedNote;
        }
      })
      .addCase(notesEdit.rejected, (state, action) => {
        state.editStatus = "rejected";
        state.error = action.error.message;
        state.items = state.items.map((note) =>
          String(note._id) === String(action.meta.arg._id)
            ? { ...note, cleaning_status: note.cleaning_status }
            : note
        );
      })
      // notesDelete
      .addCase(notesDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(notesDelete.fulfilled, (state, action) => {
        state.deleteStatus = "success";
        state.items = state.items.filter(
          (note) => String(note._id) !== String(action.payload._id)
        );
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = null;
        }
      })
      .addCase(notesDelete.rejected, (state) => {
        state.deleteStatus = "rejected";
      })
      // fetchNotesStats
      .addCase(fetchNotesStats.pending, (state) => {
        state.statsStatus = "pending";
      })
      .addCase(fetchNotesStats.fulfilled, (state, action) => {
        state.statsStatus = "success";
        state.stats.notes = action.payload;
      })
      .addCase(fetchNotesStats.rejected, (state, action) => {
        state.statsStatus = "rejected";
        state.error = action.error.message;
      })
      // fetchIncomeStats
      .addCase(fetchIncomeStats.pending, (state) => {
        state.statsStatus = "pending";
      })
      .addCase(fetchIncomeStats.fulfilled, (state, action) => {
        state.statsStatus = "success";
        state.stats.income = action.payload;
      })
      .addCase(fetchIncomeStats.rejected, (state, action) => {
        state.statsStatus = "rejected";
        state.error = action.error.message;
      });
  },
});

export const { noteAdded, noteUpdated, noteDeleted, updateStats, resetError } =
  notesSlice.actions;

export {
  notesFetch,
  fetchNoteById,
  notesCreate,
  notesEdit,
  notesDelete,
  fetchNotesStats,
  fetchIncomeStats,
};

export default notesSlice.reducer;