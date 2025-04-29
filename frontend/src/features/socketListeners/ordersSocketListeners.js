import socket from "../socket";
import { 
  socketOrderAdded,
  socketOrderUpdated,
  socketOrderStatusChanged,
  socketStatsUpdated
} from "../ordersSlice";
import { toast } from "react-toastify";

const setupOrdersSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("Socket no está disponible");
    return () => {};
  }

  const handleNewOrder = (order) => {
    try {
      dispatch(socketOrderAdded(order));
      const message = order.isGuestOrder
        ? `Orden #${order._id.slice(-4)} creada (Invitado)`
        : `Nueva orden #${order._id.slice(-4)} creada`;
      toast.success(message);
    } catch (error) {
      console.error("Error handling new order:", error);
    }
  };

  const handleUpdatedOrder = (order) => {
    try {
      dispatch(socketOrderUpdated(order));
      if (order.isGuestOrder) {
        toast.info(`Orden de invitado actualizada`);
      }
    } catch (error) {
      console.error("Error handling updated order:", error);
    }
  };

  const handleOrderStatusChange = ({ orderId, status }) => {
    try {
      dispatch(socketOrderStatusChanged({ _id: orderId, status }));
      toast.info(`Estado actualizado: ${status}`);
    } catch (error) {
      console.error("Error handling status change:", error);
    }
  };

  const handleStatsUpdate = (stats) => {
    try {
      dispatch(socketStatsUpdated(stats));
    } catch (error) {
      console.error("Error handling stats update:", error);
    }
  };

  const handleGuestOrderNotification = (notification) => {
    try {
      const { orderId, message } = notification;
      toast.info(`Orden #${orderId.slice(-4)}: ${message}`);
    } catch (error) {
      console.error("Error handling guest notification:", error);
    }
  };

  socket.on("orderCreated", handleNewOrder);
  socket.on("orderUpdated", handleUpdatedOrder);
  socket.on("orderStatusChanged", handleOrderStatusChange);
  socket.on("statsUpdated", handleStatsUpdate);
  socket.on("guestOrderNotification", handleGuestOrderNotification);

  return () => {
    socket.off("orderCreated", handleNewOrder);
    socket.off("orderUpdated", handleUpdatedOrder);
    socket.off("orderStatusChanged", handleOrderStatusChange);
    socket.off("statsUpdated", handleStatsUpdate);
    socket.off("guestOrderNotification", handleGuestOrderNotification);
  };
};

export default setupOrdersSocketListeners;