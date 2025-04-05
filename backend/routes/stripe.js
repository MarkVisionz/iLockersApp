const express = require("express");
const Stripe = require("stripe");
const { Order } = require("../models/order");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_KEY);
const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
    },
  });

  const line_items = req.body.cartItems.map((item) => ({
    price_data: {
      currency: "mxn",
      product_data: {
        name: item.name,
        images: [item.image.url],
        metadata: {
          id: item.id,
        },
      },
      unit_amount: item.price * 100,
    },
    quantity: item.cartQuantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "MX"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "mxn",
          },
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "mxn",
          },
          display_name: "Next day air",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 1 },
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    line_items,
    mode: "payment",
    customer: customer.id,
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });

  res.send({ url: session.url });
});

// CREATE ORDER FUNCTION
const createOrder = async (customer, data, lineItemsRaw, io) => {
  const customerDetails = data.customer_details || {};
  const shippingAddress = customerDetails.address || {};

  const lineItems = await stripe.checkout.sessions.listLineItems(data.id, {
    expand: ["data.price.product"]
  });

  const formattedProducts = lineItems.data.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    amount_total: item.amount_total,
    unit_amount: item.price?.unit_amount || 0,
    currency: item.currency || "mxn",
    price_id: item.price?.id || "",
    product_id: item.price?.product?.id || "",
    image: item.price?.product?.images?.[0] || "",
  }));

  const newOrder = new Order({
    userId: customer.metadata?.userId || null,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products: formattedProducts,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: shippingAddress,
    phone: customerDetails.phone || customer.phone || "",
    customer_name: customerDetails.name || customer.name || "Sin nombre",
    payment_status: data.payment_status,
  });

  try {
    const savedOrder = await newOrder.save();

    // ✅ Emitir evento
    if (io) {
      io.emit("orderCreated", savedOrder);
    }

    console.log("✅ Orden procesada:", savedOrder);
  } catch (err) {
    console.error("❌ Error al guardar orden:", err.message);
  }
};


// STRIPE WEBHOOK
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEB_HOOK;
    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Verificación de webhook fallida: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;

    if (event.type === "checkout.session.completed") {
      try {
        const customer = await stripe.customers.retrieve(data.customer);
        await createOrder(customer, data, null, req.io);
      } catch (err) {
        console.error("❌ Error procesando orden:", err.message);
      }
    }

    res.status(200).end();
  }
);

module.exports = router;
