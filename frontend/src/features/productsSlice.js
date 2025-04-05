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

export const productsFetch = createAsyncThunk(
  "products/productsFetch",
  async () => {
    try {
      const response = await axios.get(`${url}/products`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
);

export const productsCreate = createAsyncThunk(
  "products/productsCreate",
  async (values) => {
    try {
      const response = await axios.post(
        `${url}/products`,
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

export const bulkCreateProducts = createAsyncThunk(
  "products/bulkCreateProducts",
  async (products, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${url}/products/bulk`,
        { products },
        setHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.response?.data);
    }
  }
);

export const productsEdit = createAsyncThunk(
  "products/productsEdit",
  async (values) => {
    try {
      const response = await axios.put(
        `${url}/products/${values.product._id}`,
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

export const productDelete = createAsyncThunk(
  "products/productDelete",
  async ({ id, silent = false }) => {
    try {
      const response = await axios.delete(
        `${url}/products/${id}`,
        setHeaders()
      );

      // Solo mostrar toast si no es eliminación silenciosa
      if (!silent) {
        toast.error("Producto eliminado");
      }

      return response.data;
    } catch (error) {
      console.log(error);
      if (!silent) {
        toast.error(error.response?.data || "Error al eliminar producto");
      }
      throw error;
    }
  }
);


const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /////////// PRODUCTS FETCH
      .addCase(productsFetch.pending, (state) => {
        state.status = "pending";
      })
      .addCase(productsFetch.fulfilled, (state, action) => {
        state.status = "success";
        state.items = action.payload;
      })
      .addCase(productsFetch.rejected, (state) => {
        state.status = "rejected";
      })

      /////////// PRODUCTS CREATE
      .addCase(productsCreate.pending, (state) => {
        state.createStatus = "pending";
      })
      .addCase(productsCreate.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.createStatus = "success";
        toast.success("Product Created!");
      })
      .addCase(productsCreate.rejected, (state) => {
        state.createStatus = "rejected";
      })

      /////////// BULK CREATE
      .addCase(bulkCreateProducts.fulfilled, (state, action) => {
        state.items = [...state.items, ...action.payload];
        toast.success("Productos cargados exitosamente");
      })
      .addCase(bulkCreateProducts.rejected, (state, action) => {
        toast.error(action.payload || "Error al cargar productos en masa");
      })

      /////////// PRODUCTS DELETE
      .addCase(productDelete.pending, (state) => {
        state.deleteStatus = "pending";
      })
      .addCase(productDelete.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item._id !== action.payload._id
        );
        state.deleteStatus = "success";
        if (!action.meta.arg?.silent) {
          toast.error("Product Deleted");
        }        
      })
      .addCase(productDelete.rejected, (state) => {
        state.deleteStatus = "rejected";
      })

      /////////// PRODUCTS EDIT
      .addCase(productsEdit.pending, (state) => {
        state.editStatus = "pending";
      })
      .addCase(productsEdit.fulfilled, (state, action) => {
        const updatedProducts = state.items.map((product) =>
          product._id === action.payload._id ? action.payload : product
        );
        state.items = updatedProducts;
        state.editStatus = "success";
        toast.info("Product Edited");
      })
      .addCase(productsEdit.rejected, (state) => {
        state.editStatus = "rejected";
      });
  },
});

export default productSlice.reducer;
