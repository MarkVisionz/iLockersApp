const { Product } = require("../models/product");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");
const express = require("express");

const router = express.Router();

// 🟢 CREATE A PRODUCT
router.post("/", isAdmin, async (req, res) => {
  const { name, weight, price, image, category, description } = req.body;

  try {
    let imageUpload = null;

    if (image) {
      imageUpload = await cloudinary.uploader.upload(image, {
        upload_preset: "onlineLaundry",
      });
    }

    const product = new Product({
      name,
      weight,
      price,
      category,
      description,
      image: imageUpload || undefined, // solo si existe
    });

    const savedProduct = await product.save();

    req.io.emit("productCreated", savedProduct);

    res.status(201).send(savedProduct);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error al crear el producto");
  }
});

// 🗑️ DELETE PRODUCT
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Producto no encontrado");

    if (product.image?.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    req.io.emit("productDeleted", deletedProduct);

    res.status(200).send(deletedProduct);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ✏️ EDIT PRODUCT
router.put("/:id", isAdmin, async (req, res) => {
  const { product, productImg } = req.body;

  try {
    let updatedImage = product.image;

    if (productImg) {
      if (product.image?.public_id) {
        await cloudinary.uploader.destroy(product.image.public_id);
      }

      const uploaded = await cloudinary.uploader.upload(productImg, {
        upload_preset: "onlineLaundry",
      });
      updatedImage = uploaded;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...product,
          image: updatedImage,
        },
      },
      { new: true }
    );

    req.io.emit("productUpdated", updatedProduct);

    res.status(200).send(updatedProduct);
  } catch (error) {
    res.status(500).send("Error al actualizar el producto");
  }
});

// 🔍 GET ALL PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 🔍 GET ONE PRODUCT
router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Producto no encontrado");
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 📦 ADD PRODUCT IMAGE TO LINE ITEMS
router.post("/add-product-image-to-line-items", async (req, res) => {
  try {
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).send("Producto no encontrado");

    res.status(200).send(product.image?.url || null);
  } catch (error) {
    res.status(500).send(error);
  }
});

// 📥 BULK UPLOAD
router.post("/bulk", isAdmin, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).send("No se recibieron productos.");
    }

    const uploadedProducts = [];
    const defaultImage = {
      url: "https://res.cloudinary.com/mkocloud/image/upload/v1743619497/lavadora_kkmvss.png",
      public_id: "default-product",
    };

    for (const product of products) {
      const { name, weight, price, category, description, image } = product;

      if (!name || !weight || !price || !category) continue;

      let imageToUse = defaultImage;

      if (image?.url?.startsWith("data:image")) {
        try {
          const uploadRes = await cloudinary.uploader.upload(image.url, {
            upload_preset: "onlineLaundry",
          });
          imageToUse = uploadRes;
        } catch (err) {
          console.warn("❗ Error al subir imagen. Usando imagen por defecto.");
        }
      }

      const newProduct = new Product({
        name,
        weight,
        price,
        category,
        description,
        image: imageToUse,
      });

      const saved = await newProduct.save();
      uploadedProducts.push(saved);
    }

    res.status(201).send(uploadedProducts);

    req.io.emit("productsBulkCreated", uploadedProducts);

  } catch (error) {
    console.error("❌ Error en carga masiva:", error);
    res.status(500).send("Error al cargar productos en masa.");
  }
});

module.exports = router;
