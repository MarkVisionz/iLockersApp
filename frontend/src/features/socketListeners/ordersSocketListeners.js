import socket from "../socket";
import { socketOrderAdded, socketOrderUpdated, socketOrderDeleted, socketStatsUpdated } from "../ordersSlice";
import { toast } from "react-toastify";

const setupOrdersSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn('Socket connection not available');
    return () => {};
  }

  // Remove existing listeners to prevent duplicates
  socket.off("orderCreated");
  socket.off("orderUpdated");
  socket.off("orderDeleted");
  socket.off("statsUpdated");
  socket.off("guestOrderNotification");

  // Handlers
  const handleOrderCreated = (newOrder) => {
    console.log("Socket: orderCreated", newOrder._id);
    dispatch(socketOrderAdded(newOrder));
    toast.success(`Nueva orden creada: ${newOrder._id}`);
  };

  const handleOrderUpdated = (updatedOrder) => {
    console.log("Socket: orderUpdated", updatedOrder._id);
    dispatch(socketOrderUpdated(updatedOrder));
    toast.info(`Orden actualizada: ${updatedOrder._id}`);
  };

  const handleOrderDeleted = (deletedOrder) => {
    console.log("Socket: orderDeleted", deletedOrder._id);
    dispatch(socketOrderDeleted(deletedOrder));
    toast.warning(`Orden eliminada: ${deletedOrder._id}`);
  };

  const handleStatsUpdated = ({ type, data }) => {
    console.log("Socket: statsUpdated", type);
    dispatch(socketStatsUpdated({ type, data }));
  };

  const handleGuestOrderNotification = ({ orderId, message }) => {
    console.log("Socket: guestOrderNotification", orderId);
    toast.info(message);
  };

  // Register listeners
  socket.on("orderCreated", handleOrderCreated);
  socket.on("orderUpdated", handleOrderUpdated);
  socket.on("orderDeleted", handleOrderDeleted);
  socket.on("statsUpdated", handleStatsUpdated);
  socket.on("guestOrderNotification", handleGuestOrderNotification);

  // Cleanup
  return () => {
    socket.off("orderCreated", handleOrderCreated);
    socket.off("orderUpdated", handleOrderUpdated);
    socket.off("orderDeleted", handleOrderDeleted);
    socket.off("statsUpdated", handleStatsUpdated);
    socket.off("guestOrderNotification", handleGuestOrderNotification);
  };
};

export default setupOrdersSocketListeners;