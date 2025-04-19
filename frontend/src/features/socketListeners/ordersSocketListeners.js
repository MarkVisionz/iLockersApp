// features/ordersSocketListeners.js
import socket from "../socket";
import { orderUpdated, orderDeleted, updateStatsFromSocket } from "../ordersSlice";

const setupOrderSocketListeners = (dispatch) => {
  if (!socket) return;

  // Actualización de orden
  socket.on("orderUpdated", (updatedOrder) => {
    dispatch(orderUpdated(updatedOrder));
  });

  // Orden cancelada
  socket.on("orderDeleted", (deletedOrder) => {
    dispatch(orderDeleted(deletedOrder));
  });

  // Estadísticas actualizadas (ordenes, ingresos o semanales)
  socket.on("statsUpdated", ({ type, data }) => {
    dispatch(updateStatsFromSocket({ type, data }));
  });
};

export default setupOrderSocketListeners;
