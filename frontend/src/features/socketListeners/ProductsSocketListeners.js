// features/socketListeners/productsSocketListeners.js
import socket from "../socket";
import {
  addProductFromSocket,
  updateProductFromSocket,
  deleteProductFromSocket,
  addMultipleProductsFromSocket,
} from "../productsSlice";

export const startProductSocketListeners = (dispatch) => {
  socket.on("productCreated", (newProduct) => {
    dispatch(addProductFromSocket(newProduct));
  });

  socket.on("productUpdated", (updatedProduct) => {
    dispatch(updateProductFromSocket(updatedProduct));
  });

  socket.on("productDeleted", (deletedProduct) => {
    dispatch(deleteProductFromSocket(deletedProduct._id));
  });

  socket.on("productsBulkCreated", (products) => {
    dispatch(addMultipleProductsFromSocket(products));
  });
};
