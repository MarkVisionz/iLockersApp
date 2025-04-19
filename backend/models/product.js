const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true }, // en gramos
    price: { type: Number, required: true }, // en MXN
    image: { type: Object, required: false }, // ruta o URL de la imagen
    category: {
      type: String,
      enum: ["ropa común", "ropa de cama"],
      required: true,
    },
    sold: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    description: { type: String }, // opcional
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

exports.Product = Product;
