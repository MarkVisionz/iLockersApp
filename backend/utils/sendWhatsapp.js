const axios = require("axios");

const sendWhatsAppMessage = async ({
  to,
  templateName,
  languageCode = "es_ES",
  components = [],
}) => {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };

  console.log("📤 Payload enviado a WhatsApp API:");
  console.dir(payload, { depth: null });

  try {
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Mensaje enviado con éxito:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error al enviar mensaje WhatsApp:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendWhatsAppMessage };
