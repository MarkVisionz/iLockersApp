// socket-enhanced server.js
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
const ServiceRoute = require("./routes/laundryServices");
const products = require("./products");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Global socket reference
app.set("io", io);

// ⚠️ MONTA PRIMERO EL WEBHOOK como raw
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

// ✅ Luego el resto de middlewares
app.use(express.json());
app.use(cors());

// ✅ Rutas normales
app.use("/api/register", register);
app.use("/api/login", login);
app.use(
  "/api/orders",
  (req, res, next) => {
    req.io = io;
    next();
  },
  orders
);

app.use(
  "/api/stripe",
  (req, res, next) => {
    req.io = io;
    next();
  },
  stripe
);
app.use("/api/products", productsRoute);
app.use("/api/users", users);
app.use(
  "/api/notes",
  (req, res, next) => {
    req.io = io;
    next();
  },
  notesRoute
);
app.use("/api/services", ServiceRoute);

// ✅ Ruta raíz y productos
app.get("/", (req, res) => {
  res.send("Welcome to our Online Laundry API...");
});

app.get("/products", (req, res) => {
  res.send(products);
});

// ✅ Conexión a Mongo y arranque del servidor
const PORT = process.env.PORT || 5001;
const uri = process.env.DB_URI;

mongoose
  .connect(uri)
  .then(() => console.log("MongoDb connection succesful..."))
  .catch((err) => console.log("MongoDb connection failed", err.message));

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Escuchar eventos socket
  io.on("connection", (socket) => {
    console.log("🟢 New client connected: " + socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected: " + socket.id);
    });
  });
});
