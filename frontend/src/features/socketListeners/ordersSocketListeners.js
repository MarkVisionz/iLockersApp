import socket from "../socket";
import { 
  socketOrderAdded,
  socketOrderUpdated,
  socketOrderStatusChanged,
  socketStatsUpdated
} from "../ordersSlice";

const setupOrdersSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("Socket no está disponible");
    return () => {};
  }

  const handleNewOrder = (order) => {
    dispatch(socketOrderAdded(order));
  };

  const handleUpdatedOrder = (order) => {
    dispatch(socketOrderUpdated(order));
  };

  const handleOrderStatusChange = ({ orderId, status }) => {
    dispatch(socketOrderStatusChanged({ _id: orderId, status }));
  };

  const handleStatsUpdate = (stats) => {
    dispatch(socketStatsUpdated(stats));
  };

  // Registrar listeners
  socket.on("orderCreated", handleNewOrder);
  socket.on("orderUpdated", handleUpdatedOrder);
  socket.on("orderStatusChanged", handleOrderStatusChange);
  socket.on("statsUpdated", handleStatsUpdate);

  // Función de limpieza
  return () => {
    socket.off("orderCreated", handleNewOrder);
    socket.off("orderUpdated", handleUpdatedOrder);
    socket.off("orderStatusChanged", handleOrderStatusChange);
    socket.off("statsUpdated", handleStatsUpdate);
  };
};

export default setupOrdersSocketListeners;