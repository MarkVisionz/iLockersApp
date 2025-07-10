const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const register = require("./routes/register");
const login = require("./routes/login");
const orders = require("./routes/orders");
const stripe = require("./routes/stripe");
const users = require("./routes/users");
const productsRoute = require("./routes/products");
const notesRoute = require("./routes/laundryNotes");
const products = require("./products");
const firebaseAuth = require("./routes/firebaseAuth");
const servicesRoutes = require("./routes/services");
const businessRoutes = require("./routes/business");

require("./cron/cleanUnverifiedUsersJob");
require("dotenv").config();

// Importar modelos antes de cualquier middleware o ruta
console.log("Importando modelos...");
require("./models/user");
require("./models/laundryServices");
require("./models/business");
console.log("Modelos importados");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware para el webhook de Stripe (PRIMERO)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// Middlewares para parsear cuerpos (DESPUÉS)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
app.use("/api/services", servicesRoutes);
app.use("/api/business", businessRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to our Online Laundry API...");
});

app.get("/products", (req, res) => {
  res.send(products);
});

io.on("connection", (socket) => {
  console.log(`🟢 Nuevo cliente conectado: ${socket.id}`);
  socket.on("subscribeToUserUpdates", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`🔔 Cliente ${socket.id} suscrito a updates de usuario ${userId}`);
  });
  socket.on("disconnect", (reason) => {
    console.log(`🔴 Cliente desconectado: ${socket.id} - Razón: ${reason}`);
  });
  socket.on("error", (error) => {
    console.error(`❌ Error en socket ${socket.id}:`, error.message);
  });
});

const uri = process.env.DB_URI;
mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});