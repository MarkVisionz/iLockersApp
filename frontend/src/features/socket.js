// src/features/socket.js

import { io } from "socket.io-client";

// Conéctate a la raíz del backend (sin /api)
const socket = io("http://localhost:5001", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;
