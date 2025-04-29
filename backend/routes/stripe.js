const express = require("express");
const Stripe = require("stripe");
const Order = require("../models/order");
const User = require("../models/user");
const logger = require("../utils/logger");
require("dotenv").config();
const mongoose = require("mongoose");

const stripe = Stripe(process.env.STRIPE_KEY);
const router = express.Router();

// Middleware de validación
const validateCheckoutRequest = (req, res, next) => {
  const { guestId, userId, cartItems } = req.body;

  if (!userId && !guestId) {
    return res.status(400).json({
      code: "MISSING_IDENTIFIER",
      message: "Se requiere userId o guestId para el checkout",
    });
  }

  if (!Array.isArray(cartItems)) {
    return res.status(400).json({
      code: "INVALID_CART_ITEMS",
      message: "Los items del carrito deben ser un array",
    });
  }

  for (const [index, item] of cartItems.entries()) {
    if (!item.id || typeof item.id !== "string") {
      return res.status(400).json({
        code: "INVALID_PRODUCT_ID",
        message: `El producto en posición ${index} no tiene un ID válido`,
      });
    }
    if (!item.price || isNaN(item.price) || item.price <= 0) {
      return res.status(400).json({
        code: "INVALID_PRODUCT_PRICE",
        message: `El producto ${item.id} tiene un precio inválido`,
      });
    }
  }

  next();
};

// Crear sesión de checkout
router.post(
  "/create-checkout-session",
  validateCheckoutRequest,
  async (req, res) => {
    try {
      const { userId, guestId, cartItems } = req.body;

      if (userId) {
        const user = await User.findById(userId);
        if (!user) {
          return res
            .status(404)
            .json({ code: "USER_NOT_FOUND", message: "El usuario no existe" });
        }
      }

      if (guestId) {
        const guest = await User.findOne({ _id: guestId, isGuest: true });
        if (!guest) {
          return res
            .status(404)
            .json({ code: "GUEST_NOT_FOUND", message: "El guest no existe" });
        }
      }

      const line_items = cartItems.map((item) => ({
        price_data: {
          currency: "mxn",
          product_data: {
            name: item.name?.substring(0, 254) || "Producto sin nombre",
            description:
              item.description?.substring(0, 254) || "Producto sin descripción",
            images: item.image && item.image.url ? [item.image.url] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.cartQuantity,
        adjustable_quantity: { enabled: false },
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        metadata: {
          userId: userId || "",
          guestId: guestId || "",
          cartItemsCount: cartItems.length.toString(),
        },
        success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/cart?canceled=true`,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
        shipping_address_collection: {
          allowed_countries: ["MX", "US"],
        },
        phone_number_collection: {
          enabled: true,
        },
      });

      logger.info("Checkout session creada", { sessionId: session.id });

      res.json({ success: true, url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("[ERROR FATAL] en create-checkout-session:", error.message);
      res.status(500).json({
        code: "CHECKOUT_ERROR",
        message: error.message || "Error al crear la sesión de pago",
      });
    }
  }
);

// Webhook de Stripe
async function handleWebhookEvent(event) {
  const data = event.data.object;
  console.log("\ud83d\udce6 Webhook recibido:", {
    type: event.type,
    id: event.id,
  });

  try {
    if (event.type === "checkout.session.completed") {
      console.log("Datos recibidos en checkout.session.completed:", data);

      if (!data.payment_intent) {
        throw new Error("PaymentIntent no encontrado en la sesión");
      }

      const customer = {
        metadata: data.metadata || {},
        email: data.customer_details?.email || "",
        phone: data.customer_details?.phone || "",
        name: data.customer_details?.name || "Cliente Invitado",
      };

      const guestId = data.metadata?.guestId;
      if (guestId) {
        if (!mongoose.Types.ObjectId.isValid(guestId)) {
          throw new Error(
            "guestId inv\u00e1lido recibido en checkout.session.completed"
          );
        }
        const customerDetails = data.customer_details || {};
        const shippingAddress = data.shipping_details?.address || {};

        const addressUpdate =
          shippingAddress.line1 &&
          shippingAddress.city &&
          shippingAddress.postal_code
            ? [
                {
                  line1: shippingAddress.line1,
                  line2: shippingAddress.line2 || "",
                  city: shippingAddress.city,
                  postal_code: shippingAddress.postal_code,
                  country: shippingAddress.country || "MX",
                  state: shippingAddress.state || "",
                  phone: customerDetails.phone || "",
                  isDefault: true,
                },
              ]
            : [];

        // ⚡️ Validar email duplicado antes de actualizar
        const existingUser = await User.findOne({
          email: customerDetails.email,
          _id: { $ne: guestId }, // otro usuario que no sea este guest
        });

        let updateFields = {
          name: customerDetails.name || "Cliente Invitado",
          addresses: addressUpdate,
        };

        if (!existingUser && customerDetails.email) {
          updateFields.email = customerDetails.email; // sólo si no hay duplicado
        } else {
          logger.warn("Email duplicado detectado, no se actualiza email", {
            email: customerDetails.email,
            guestId,
          });
        }

        const updatedGuest = await User.findOneAndUpdate(
          { _id: guestId, isGuest: true },
          { $set: updateFields },
          { new: true }
        );

        if (updatedGuest) {
          logger.info("✅ Usuario invitado actualizado correctamente", {
            guestId,
          });
        } else {
          logger.warn("⚠️ No se encontró el guest para actualizar", {
            guestId,
          });
        }
      }

      const existingOrder = await Order.findOne({
        paymentIntentId: data.payment_intent,
      });
      if (existingOrder) {
        logger.warn("Orden duplicada detectada", {
          paymentIntent: data.payment_intent,
        });
        return { success: true, warning: "Orden ya existe" };
      }

      const order = await createOrder(customer, data);

      return { success: true, orderId: order?._id };
    }

    return { success: true, info: "Evento no manejado" };
  } catch (err) {
    console.error("\u274c Error en webhook:", err);
    logger.error(`Error en webhook ${event.type}`, { error: err });
    throw err;
  }
}

// Endpoint de webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEB_HOOK
      );
    } catch (err) {
      logger.error("Firma de webhook inválida", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const result = await handleWebhookEvent(event);

      logger.info(`Webhook ${event.type} procesado`, {
        eventId: event.id,
        orderId: result.orderId,
      });
      return res.status(200).json(result);
    } catch (err) {
      logger.error("Error al procesar webhook", err);
      return res.status(500).json({
        success: false,
        message: "Error interno al procesar el evento",
        error: err.message,
      });
    }
  }
);

// Crear orden
// Crear orden
async function createOrder(customer, sessionData) {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(
      sessionData.id
    );

    if (!lineItems.data.length) {
      throw new Error("No se encontraron productos en la sesión");
    }

    // 🔥 CORREGIDO: Fetch manual de cada producto para traer la imagen
    const products = await Promise.all(
      lineItems.data.map(async (item) => {
        let image = "";

        if (item.price?.product) {
          try {
            const productData = await stripe.products.retrieve(item.price.product);
            image = productData.images?.[0] || "";
          } catch (error) {
            console.error(`❌ Error obteniendo imagen de producto ${item.price.product}:`, error.message);
          }
        }

        return {
          description: item.description?.substring(0, 254) || "Producto sin descripción",
          quantity: item.quantity,
          amount_total: item.amount_total,
          unit_amount: item.price?.unit_amount || 0,
          currency: item.currency || "mxn",
          price_id: item.price?.id || "",
          product_id: item.price?.product || "",
          image, // ✅ ahora cargada correctamente
        };
      })
    );

    const shippingAddress = sessionData.shipping_details?.address || {};
    const contactInfo = {
      email: customer.email,
      phone: customer.phone,
      name: customer.name,
    };

    const orderData = {
      userId: customer.metadata?.userId || sessionData.metadata?.userId || null,
      guestId:
        customer.metadata?.guestId || sessionData.metadata?.guestId || null,
      isGuestOrder: !!(
        customer.metadata?.guestId || sessionData.metadata?.guestId
      ),
      customerId: sessionData.customer || null,
      paymentIntentId: sessionData.payment_intent,
      products,
      subtotal: sessionData.amount_subtotal / 100,
      shipping_cost: sessionData.shipping_cost?.amount_subtotal / 100 || 0,
      total: sessionData.amount_total / 100,
      shipping: {
        line1: shippingAddress.line1 || "",
        line2: shippingAddress.line2 || "",
        city: shippingAddress.city || "",
        postal_code: shippingAddress.postal_code || "",
        country: shippingAddress.country || "MX",
        state: shippingAddress.state || "",
      },
      contact: contactInfo,
      payment_status: sessionData.payment_status || "pending",
      delivery_status: "pending",
      metadata: sessionData.metadata || {}
    };

    const savedOrder = await new Order(orderData).save();

    logger.info(`Orden ${savedOrder._id} creada`, {
      orderType: savedOrder.isGuestOrder ? "GUEST" : "REGISTERED",
      amount: savedOrder.total,
    });

    return savedOrder;
  } catch (err) {
    logger.error("Error al crear orden", err);
    throw err;
  }
}


module.exports = router;
