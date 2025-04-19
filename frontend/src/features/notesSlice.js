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

const fetchNoteById = createAsyncThunk(
  "notes/fetchNoteById",
  async (id) => {
    try {
      const response = await axios.get(`${url}/notes/findOne/${id}`, setHeaders());
      return response.data;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data || "Failed to fetch note");
      throw error;
    }
  }
);

const notesCreate = createAsyncThunk(
  "notes/notesCreate",
  async (values) => {
    try {
      const response = await axios.post(`${url}/notes`, values, setHeaders());
      return response.data;
    } catch (error) {
      console.log("Error details:", error.response);
      toast.error(error.response?.data.message || "An error occurred");
      throw error;
    }
  }
);

const notesEdit = createAsyncThunk(
  "notes/notesEdit",
  async (values) => {
    try {
      const response = await axios.put(
        `${url}/notes/${values._id}`,
        values,
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

const notesDelete = createAsyncThunk(
  "notes/notesDelete",
  async (id) => {
    try {
      const response = await axios.delete(`${url}/notes/${id}`, setHeaders());
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

const fetchNotesStats = createAsyncThunk(
  "notes/fetchNotesStats",
  async () => {
    try {
      const response = await axios.get(`${url}/notes/stats`, setHeaders());
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

const fetchIncomeStats = createAsyncThunk(
  "notes/fetchIncomeStats",
  async () => {
    try {
      const response = await axios.get(`${url}/notes/income/stats`, setHeaders());
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
      state.items.push(action.payload);
    },
    noteUpdated: (state, action) => {
      const updatedNotes = state.items.map((note) =>
        note._id === action.payload._id ? action.payload : note
      );
      state.items = updatedNotes;
      if (state.currentNote?._id === action.payload._id) {
        state.currentNote = action.payload;
      }
    },
    noteDeleted: (state, action) => {
      state.items = state.items.filter(
        (note) => note._id !== action.payload._id
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
        state.items = action.payload;
      })
      .addCase(notesFetch.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      // fetchNoteById
      .addCase(fetchNoteById.pending, (state) => {
        state.fetchNoteStatus = "pending";
      })
      .addCase(fetchNoteById.fulfilled, (state, action) => {
        state.fetchNoteStatus = "success";
        state.currentNote = action.payload;
        if (!state.items.some((note) => note._id === action.payload._id)) {
          state.items.push(action.payload);
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
        state.items.push(action.payload);
        state.createStatus = "success";
        toast.success("Note Created!");
      })
      .addCase(notesCreate.rejected, (state) => {
        state.createStatus = "rejected";
      })
      // notesEdit
      .addCase(notesEdit.pending, (state) => {
        state.editStatus = "pending";
      })
      .addCase(notesEdit.fulfilled, (state, action) => {
        const updatedNotes = state.items.map((note) =>
          note._id === action.payload._id ? action.payload : note
        );
        state.items = updatedNotes;
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = action.payload;
        }
        state.editStatus = "success";
        toast.info("Note Edited");
      })
      .addCase(notesEdit.rejected, (state) => {
        state.editStatus = "rejected";
      })
      // notesDelete
      .addCase(notesDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(notesDelete.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (note) => note._id !== action.payload._id
        );
        if (state.currentNote?._id === action.payload._id) {
          state.currentNote = null;
        }
        state.deleteStatus = "success";
        toast.error("Note Deleted");
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

// Export actions and thunks
export const {
  noteAdded,
  noteUpdated,
  noteDeleted,
  updateStats,
} = notesSlice.actions;

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