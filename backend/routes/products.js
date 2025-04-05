const { Product } = require("../models/product");
const { auth, isUser, isAdmin } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

const express = require("express");

const router = express.Router();

// CREATE A PRODUCT

router.post("/", isAdmin, async (req, res) => {
  const { name, weight, price, image } = req.body;

  try {
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        upload_preset: "onlineLaundry",
      });

      if (uploadRes) {
        const product = new Product({
          name,
          weight,
          price,
          image: uploadRes,
        });

        const savedProduct = await product.save();

        res.status(200).send(savedProduct);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// DELETE

router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).send("Product not found...");

    if (product.image.public_id) {
      const destroyResponse = await cloudinary.uploader.destroy(
        product.image.public_id
      );

      if (destroyResponse) {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        res.status(200).send(deletedProduct);
      }
    } else {
      console.log("Action terminated. Failed to deleted product image...");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

// EDIT PRODUCT

router.put("/:id", isAdmin, async (req, res) => {
  console.log(req.body.productImg);
  if (req.body.productImg) {
    try {
      const destroyResponse = await cloudinary.uploader.destroy(
        req.body.product.image.public_id
      );

      if (destroyResponse) {
        const uploadedResponse = await cloudinary.uploader.upload(
          req.body.productImg,
          {
            upload_preset: "online-shop",
          }
        );

        if (uploadedResponse) {
          const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
              $set: {
                ...req.body.product,
                image: uploadedResponse,
              },
            },
            { new: true }
          );

          res.status(200).send(updatedProduct);
        }
      }
    } catch (err) {
      res.status(500).send(error);
    }
  } else {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body.product,
        },
        { new: true }
      );
      res.status(200).send(updatedProduct);
    } catch (err) {
      res.status(500).send(err);
    }
  }
});

// GET ALL PRODUCTS

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// GET PRODUCT

router.get("/find/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ADD PRODUCT IMAGE TO LINE ITEMS
router.post("/add-product-image-to-line-items", async (req, res) => {
  try {
    const product = await Product.findById(req.body.productId);

    if (!product) return res.status(404).send("Product not found...");

    // Obtener la URL de la imagen del producto
    const imageURL = product.image.url;

    res.status(200).send(imageURL);
  } catch (error) {
    res.status(500).send(error);
  }
});

// BULK UPLOAD WITH DEFAULT IMAGE IF NOT PROVIDED
router.post("/bulk", isAdmin, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).send("No products provided.");
    }

    const uploadedProducts = [];
    const defaultImage = {
      url: "https://res.cloudinary.com/mkocloud/image/upload/v1743619497/lavadora_kkmvss.png",
      public_id: "default-product",
    };

    for (const product of products) {
      const { name, weight, price, image } = product;

      if (!name || !weight || !price) continue;

      let imageToUse = defaultImage;

      // Si se provee una imagen válida, subirla
      if (image?.url && image.url.startsWith("data:image")) {
        try {
          const uploadRes = await cloudinary.uploader.upload(image.url, {
            upload_preset: "onlineLaundry",
          });
          imageToUse = uploadRes;
        } catch (uploadErr) {
          console.warn("Error al subir imagen, se usará la imagen por defecto.");
        }
      }

      const newProduct = new Product({
        name,
        weight,
        price,
        image: imageToUse,
      });

      const savedProduct = await newProduct.save();
      uploadedProducts.push(savedProduct);
    }

    res.status(201).send(uploadedProducts);
  } catch (error) {
    console.error("Error en /products/bulk:", error);
    res.status(500).send("Error al subir productos en masa.");
  }
});




module.exports = router;
