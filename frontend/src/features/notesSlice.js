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
    }
  }
);

export const notesEdit = createAsyncThunk(
  "notes/notesEdit",
  async (values) => {
    try {
      const response = await axios.put(
        `${url}/notes/${values.product._id}`,
        values,
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data, {
        position: "bottom-left",
      });
    }
  }
);

export const notesDelete = createAsyncThunk(
  "products/productDelete",
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
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      /////////// PRODUCTS FETCH
      .addCase(notesFetch.pending, (state, action) => {
        state.status = "pending";
      })
      .addCase(notesFetch.fulfilled, (state, action) => {
        state.status = "success";
        state.items = action.payload;
      })
      .addCase(notesFetch.rejected, (state, action) => {
        state.status = "rejected";
      })

      /////////// PRODUCTS CREATE
      .addCase(notesCreate.pending, (state, action) => {
        state.createStatus = "pending";
      })
      .addCase(notesCreate.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.createStatus = "success";
        toast.success("Note Created!");
      })
      .addCase(notesCreate.rejected, (state, action) => {
        state.createStatus = "rejected";
      })

      /////////// PRODUCTS DELETE

      .addCase(notesDelete.pending, (state, action) => {
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
      .addCase(notesDelete.rejected, (state, action) => {
        state.deleteStatus = "rejected";
      })

      /////////// PRODUCTS EDIT

      .addCase(notesEdit.pending, (state, action) => {
        state.editStatus = "pending";
      })
      .addCase(notesEdit.fulfilled, (state, action) => {
        const updatedNotes = state.items.map((note) =>
          note._id === action.payload._id ? action.payload : note
        );
        console.log(updatedNotes);
        console.log(action.payload);
        console.log("stateI",state.items);
  
        state.items = updatedNotes;
        state.editStatus = "success";
        toast.info("Note Edited");
      })
      .addCase(notesEdit.rejected, (state, action) => {
        state.editStatus = "rejected";
      });
  },
});

export default notesSlice.reducer;
