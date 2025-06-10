require("dotenv").config();
const { sendWhatsAppMessage } = require("./utils/sendWhatsapp");

(async () => {
  try {
    const res = await sendWhatsAppMessage({
      to: "5219841561805",
      templateName: "nueva_nota",
      languageCode: "es_ES",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: "Marko Giovanni" },               // {{1}} nombre
            { type: "text", text: "FOLIO-9790793" },                // {{2}} folio
            { type: "text", text: "Lavado x 2kg = $40" },           // {{3}} servicios
            { type: "text", text: "$100.00" },                      // {{4}} total
            { type: "text", text: "+5219841561805" },               // {{5}} teléfono
          ]
        }
      ]
    });

    console.log("✅ Mensaje enviado:", res);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
})();
