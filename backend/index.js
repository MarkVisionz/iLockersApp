const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const register = require("./routes/register");
const login = require("./routes/login");
const orders = require("./routes/orders")
const stripe = require("./routes/stripe")
const users = require("./routes/users")
const productsRoute = require("./routes/products")
const notesRoute = require("./routes/laundryNotes")
const ServiceRoute = require("./routes/laundryServices")

const products = require("./products");

const app = express();

require("dotenv").config();

app.use(express.json());
app.use(cors());

app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/orders", orders)
app.use("/api/stripe", stripe)
app.use("/api/products", productsRoute)
app.use("/api/users", users)
app.use("/api/notes", notesRoute);
app.use("/api/services", ServiceRoute);



app.get("/", (req, res) => {
  res.send("Welcome to our Online Laundry API...");
});

app.get("/products", (req, res) => {
  res.send(products);
});

const PORT = process.env.PORT || 5000;
const uri = process.env.DB_URI;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDb connection succesful..."))
  .catch((err) => console.log("MongoDb connection failed", err.message));
