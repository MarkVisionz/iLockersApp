import setupProductsSocketListeners from "./ProductsSocketListeners";
import setupOrdersSocketListeners from "./ordersSocketListeners";
import setupLaundrySocketListeners from "./laundryNoteSocketListeners";
import setupServiceSocketListeners from "./ServiceSocketListeners";
import setupUsersSocketListeners from "./UsersSocketListeners";
import socket from "../socket";
import setupBusinessSocketListeners from "./BusinessSocketListeners";

const setupAllSocketListeners = (dispatch) => {
  const listeners = [
    setupProductsSocketListeners,
    setupOrdersSocketListeners,
    setupLaundrySocketListeners,
    setupServiceSocketListeners,
    setupUsersSocketListeners,
    setupBusinessSocketListeners,
  ].filter(Boolean);

  if (!socket.connected) {
    socket.on("connect", () => {
      console.info("Socket connected, re-attaching listeners");
      listeners.forEach(setup => setup(dispatch));
    });
  }  

  const cleanups = listeners.map(setup => {
    try {
      return setup(dispatch);
    } catch (error) {
      console.error('Error setting up listener:', error);
      return null;
    }
  }).filter(Boolean);

  return () => {
    cleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (e) {
        console.error('Error during socket cleanup:', e);
      }
    });
  };
};

export default setupAllSocketListeners;