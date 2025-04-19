const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// Importación de rutas
const register = require("./routes/register");
const login = require("./routes/login");
const orders = require("./routes/orders");
const stripe = require("./routes/stripe");
const users = require("./routes/users");
const productsRoute = require("./routes/products");
const notesRoute = require("./routes/laundryNotes");
const products = require("./products");
const firebaseAuth = require("./routes/firebaseAuth");

const servcesRoutes = require("./routes/services");

// Jobs programados
require("./cron/cleanUnverifiedUsersJob");

// Configuración de entorno
require("dotenv").config();

// Inicialización de Express y HTTP server
const app = express();
// 🔧 Aumentar el límite de carga
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
const server = http.createServer(app);

// Configuración mejorada de Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Más seguro que "*"
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Para manejar cookies/tokens
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos para reconexión
    skipMiddlewares: true,
  },
});

// Middleware para inyectar io en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuración de middlewares
app.use("/api/stripe/webhook", express.raw({ type: "application/json" })); // Webhook Stripe
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Configuración de rutas
app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/orders", orders);
app.use("/api/stripe", stripe);
app.use("/api/products", productsRoute);
app.use("/api/users", users);
app.use("/api/notes", notesRoute);
app.use("/api/auth", firebaseAuth);
app.use("/api/services", servcesRoutes);

// Rutas básicas
app.get("/", (req, res) => {
  res.send("Welcome to our Online Laundry API...");
});

app.get("/products", (req, res) => {
  res.send(products);
});

// Manejo de conexiones Socket.IO
io.on("connection", (socket) => {
  console.log(`🟢 Nuevo cliente conectado: ${socket.id}`);

  // Suscripción a actualizaciones de usuario
  socket.on("subscribeToUserUpdates", (userId) => {
    socket.join(`user_${userId}`);
    console.log(
      `🔔 Cliente ${socket.id} suscrito a updates de usuario ${userId}`
    );
  });

  // Manejo de desconexión
  socket.on("disconnect", (reason) => {
    console.log(`🔴 Cliente desconectado: ${socket.id} - Razón: ${reason}`);
  });

  // Manejo de errores
  socket.on("error", (error) => {
    console.error(`❌ Error en socket ${socket.id}:`, error.message);
  });
});

// Conexión a MongoDB
const uri = process.env.DB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// Inicio del servidor
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});
