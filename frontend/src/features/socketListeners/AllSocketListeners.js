import setupProductsSocketListeners from "./ProductsSocketListeners";
import setupOrdersSocketListeners from "./ordersSocketListeners";
import setupLaundrySocketListeners from "./laundryNoteSocketListeners";
import setupServiceSocketListeners from "./ServiceSocketListeners";
import setupUsersSocketListeners from "./UsersSocketListeners";
import socket from "../socket"; // Importar socket si necesitas verificaciones

const setupAllSocketListeners = (dispatch) => {
  // Verificación de conexión del socket (opcional)
  if (!socket?.connected) {
    console.warn('Socket not connected during setup');
  }

  // Configuración de listeners con validación
  const listeners = [
    setupProductsSocketListeners,
    setupOrdersSocketListeners,
    setupLaundrySocketListeners,
    setupServiceSocketListeners,
    setupUsersSocketListeners
  ].filter(Boolean);

  // Ejecutar setup y recolectar cleanups
  const cleanups = listeners.map(setup => {
    try {
      return setup(dispatch);
    } catch (error) {
      console.error('Error setting up listener:', error);
      return null;
    }
  }).filter(Boolean);

  // Función de limpieza consolidada
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