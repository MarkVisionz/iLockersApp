import socket from "../socket";
import {
  addProductFromSocket,
  updateProductFromSocket,
  deleteProductFromSocket,
  addMultipleProductsFromSocket,
} from "../productsSlice";
import { toast } from "react-toastify";

const setupProductsSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn('Socket connection not available');
    return () => {};
  }

  // Handlers con notificaciones Toast
  const handleProductCreated = (newProduct) => {
    try {
      dispatch(addProductFromSocket(newProduct));
      toast.success(`Producto creado: ${newProduct.name}`);
    } catch (error) {
      toast.error('Error al procesar nuevo producto');
      console.error('Error handling productCreated:', error);
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    try {
      dispatch(updateProductFromSocket(updatedProduct));
      toast.info(`Producto actualizado: ${updatedProduct.name}`);
    } catch (error) {
      toast.error('Error al actualizar producto');
      console.error('Error handling productUpdated:', error);
    }
  };

  const handleProductDeleted = ({ _id, name }) => {
    try {
      dispatch(deleteProductFromSocket(_id));
      toast.warning(`Producto eliminado: ${name || _id}`);
    } catch (error) {
      toast.error('Error al eliminar producto');
      console.error('Error handling productDeleted:', error);
    }
  };

  const handleBulkProductsCreated = (products) => {
    try {
      dispatch(addMultipleProductsFromSocket(products));
      toast.success(`${products.length} productos creados correctamente`);
    } catch (error) {
      toast.error('Error al cargar productos múltiples');
      console.error('Error handling productsBulkCreated:', error);
    }
  };

  // Registrar listeners
  socket.on("productCreated", handleProductCreated);
  socket.on("productUpdated", handleProductUpdated);
  socket.on("productDeleted", handleProductDeleted);
  socket.on("productsBulkCreated", handleBulkProductsCreated);

  // Retornar función de limpieza
  return () => {
    socket.off("productCreated", handleProductCreated);
    socket.off("productUpdated", handleProductUpdated);
    socket.off("productDeleted", handleProductDeleted);
    socket.off("productsBulkCreated", handleBulkProductsCreated);
  };
};

export default setupProductsSocketListeners;