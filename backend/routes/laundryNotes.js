const { LaundryNote } = require("../models/laundryNote");
const express = require("express");
const router = express.Router();
const moment = require("moment");

const twilio = require("twilio");

// Cargar las credenciales de Twilio desde variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

// Función para enviar mensaje de WhatsApp
const sendWhatsAppMessage = async (phoneNumber, messageBody) => {
  try {
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_WHATSAPP_NUMBER, // Número de Twilio con WhatsApp habilitado
      to: `whatsapp:${phoneNumber}`, // Número del cliente en formato internacional
    });
    console.log("Mensaje enviado:", message.sid);
  } catch (error) {
    console.error("Error enviando mensaje de WhatsApp:", error);
  }
};

// CREATE A NOTE
router.post("/", async (req, res) => {
  const {
    name,
    folio,
    date,
    services,
    observations,
    abono,
    suavitelDesired,
    total,
    note_status,
    paidAt,
    phoneNumber,
  } = req.body;

  try {
    // Crear una nueva nota
    const laundryNote = new LaundryNote({
      name,
      folio,
      date,
      services,
      observations,
      abono,
      suavitelDesired,
      total,
      note_status,
      paidAt,
      phoneNumber,
    });

    const savedLaundryNote = await laundryNote.save();

    // Transformar el objeto services en un array de sus entradas (clave-valor)
    const servicesList = Object.entries(services)
      .map(
        ([serviceName, serviceDetails]) =>
          `${serviceName}: ${serviceDetails.quantity}`
      )
      .join(", ");

    const messageBody = `
Hola ${name}, gracias por usar nuestro servicio de lavandería.
- Folio: ${folio}
- Fecha: ${date}
- Servicios: ${servicesList}
- Total: $${total}
- Abono: $${abono}
${
  suavitelDesired
    ? "✔ Se aplicará suavitel a tu ropa"
    : "✘ No se aplicará suavitel"
}

¡Gracias por tu preferencia!
`;

    await sendWhatsAppMessage(phoneNumber, messageBody);

    res.status(200).send(savedLaundryNote);
  } catch (error) {
    console.error("Error saving laundry note:", error.message); // Loguea el error
    res.status(500).send({ message: error.message }); // Devuelve el error al frontend
  }
});

// GET ALL NOTES
router.get("/", async (req, res) => {
  try {
    const notes = await LaundryNote.find();
    res.status(200).send(notes);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// DELETE NOTE
router.delete("/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found...");

    const deletedNote = await LaundryNote.findByIdAndDelete(req.params.id);
    res.status(200).send(deletedNote);
  } catch (error) {
    res.status(500).send(error);
  }
});

// EDIT NOTE - Modificación aquí
router.put("/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);

    if (!note) return res.status(404).send("Note not found...");

    const { note_status } = req.body;

    // Si el estado cambia a "pagado" y aún no se ha registrado `paidAt`
    if (note_status === "pagado" && !note.paidAt) {
      note.paidAt = new Date(); // Registra la fecha de pago
    }

    // Si el estado cambia a "entregado", solo actualiza `deliveredAt`
    if (note_status === "entregado") {
      note.deliveredAt = new Date(); // Registra la fecha de entrega
    }

    // Actualiza el estado de la nota
    note.note_status = note_status;

    // Guarda los cambios
    const updatedNote = await note.save();

    res.status(200).send(updatedNote);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET NOTE BY ID
router.get("/findOne/:id", async (req, res) => {
  try {
    const note = await LaundryNote.findById(req.params.id);

    if (!note) return res.status(404).send("Note not found...");

    res.status(200).send(note);
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET INCOME STATS
router.get("/income/stats", async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const income = await LaundryNote.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          total: "$total",
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$total" },
        },
      },
    ]);

    res.status(200).send(income);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// GET NOTES STATS
router.get("/stats", async (req, res) => {
  const previousMonth = moment()
    .month(moment().month() - 1)
    .set("date", 1)
    .format("YYYY-MM-DD HH:mm:ss");

  try {
    const notes = await LaundryNote.aggregate([
      {
        $match: { createdAt: { $gte: new Date(previousMonth) } },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);

    res.status(200).send(notes);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

module.exports = router;
