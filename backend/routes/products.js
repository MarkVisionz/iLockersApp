const { Product } = require("../models/product");
const {auth, isUser, isAdmin} = require("../middleware/auth")
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


///////

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

module.exports = router;
