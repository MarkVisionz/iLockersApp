import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { setHeaders, url } from "./api";
import { toast } from "react-toastify";

const initialState = {
  items: [],
  status: null,
  createStatus: null,
  editStatus: null,
  deleteStatus: null,
};

export const notesFetch = createAsyncThunk(
  "notes/notesFetch",
  async () => {
    try {
      const response = await axios.get(`${url}/notes`);
      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
);

export const notesCreate = createAsyncThunk(
  "notes/notesCreate",
  async (values) => {
    try {
      const response = await axios.post(
        `${url}/notes`,
        values,
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data);
      throw error;
    }
  }
);

export const notesEdit = createAsyncThunk(
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
      toast.error(error.response?.data, {
        position: "bottom-left",
      });
      throw error;
    }
  }
);

export const notesDelete = createAsyncThunk(
  "notes/notesDelete",
  async (id) => {
    try {
      const response = await axios.delete(
        `${url}/notes/${id}`,
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data);
      throw error;
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // NOTES FETCH
      .addCase(notesFetch.pending, (state) => {
        state.status = "pending";
      })
      .addCase(notesFetch.fulfilled, (state, action) => {
        state.status = "success";
        state.items = action.payload;
      })
      .addCase(notesFetch.rejected, (state) => {
        state.status = "rejected";
      })

      // NOTES CREATE
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

      // NOTES DELETE
      .addCase(notesDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(notesDelete.fulfilled, (state, action) => {
        const newList = state.items.filter(
          (item) => item._id !== action.payload._id
        );
        state.items = newList;
        state.deleteStatus = "success";
        toast.error("Note Deleted");
      })
      .addCase(notesDelete.rejected, (state) => {
        state.deleteStatus = "rejected";
      })

      // NOTES EDIT
      .addCase(notesEdit.pending, (state) => {
        state.editStatus = "pending";
      })
      .addCase(notesEdit.fulfilled, (state, action) => {
        const updatedNotes = state.items.map((note) =>
          note._id === action.payload._id ? action.payload : note
        );
        state.items = updatedNotes;
        state.editStatus = "success";
        toast.info("Note Edited");
      })
      .addCase(notesEdit.rejected, (state) => {
        state.editStatus = "rejected";
      });
  },
});

export default notesSlice.reducer;
