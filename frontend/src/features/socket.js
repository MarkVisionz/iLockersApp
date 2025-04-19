import { io } from "socket.io-client";

// Configuración desde variables de entorno
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";

// Configuración mejorada del socket
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Fuerza WebSocket
  autoConnect: true, // Conexión automática
  reconnection: true,
  reconnectionAttempts: Infinity, // Reintentos ilimitados
  reconnectionDelay: 1000, // 1 segundo inicial
  reconnectionDelayMax: 5000, // Máximo 5 segundos
  randomizationFactor: 0.5, // Variación en los reintentos
  auth: (cb) => {
    // Enviar token JWT si está disponible
    const token = localStorage.getItem("token");
    cb({ token });
  }
});

// Eventos para debugging mejorado
const logSocketEvent = (event, data) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Socket ${event}:`, data || socket.id);
};

// Manejadores de eventos principales
socket
  .on("connect", () => {
    logSocketEvent("connect");
    // Resubscribirse a actualizaciones después de reconexión
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("subscribeToUserUpdates", userId);
    }
  })
  .on("connect_error", (err) => {
    logSocketEvent("connect_error", err.message);
    console.error("Posibles soluciones:");
    console.error("1. Verifica que el servidor Socket.IO esté corriendo");
    console.error("2. Revisa la configuración CORS en el servidor");
    console.error("3. Verifica tu conexión a internet");
  })
  .on("disconnect", (reason) => {
    logSocketEvent("disconnect", reason);
  })
  .on("reconnect_attempt", (attempt) => {
    logSocketEvent("reconnect_attempt", attempt);
  })
  .on("reconnect", (attempt) => {
    logSocketEvent("reconnect", `Después de ${attempt} intentos`);
  })
  .on("reconnect_error", (error) => {
    logSocketEvent("reconnect_error", error.message);
  })
  .on("reconnect_failed", () => {
    logSocketEvent("reconnect_failed");
    console.error("Reconexión fallida. Recarga la página o intenta más tarde.");
  });

// Funciones para manejar suscripciones
export const subscribeToUserUpdates = (userId) => {
  if (userId) {
    socket.emit("subscribeToUserUpdates", userId);
    localStorage.setItem("userId", userId);
    console.log(`Subscribed to updates for user ${userId}`);
  }
};

export const unsubscribeFromUserUpdates = (userId) => {
  if (userId) {
    socket.emit("unsubscribeFromUserUpdates", userId);
    console.log(`Unsubscribed from updates for user ${userId}`);
  }
};

// Función para forzar reconexión
export const reconnectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export default socket;