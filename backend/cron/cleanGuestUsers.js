const mongoose = require("mongoose");
require("dotenv").config();

const runCleanup = async () => {
  try {
    const User = mongoose.model("User");
    const result = await User.deleteMany({
      isGuest: true,
      guestExpiresAt: { $lt: new Date() }
    });
    console.log(`✅ Eliminados ${result.deletedCount} usuarios guest expirados`);
  } catch (error) {
    console.error("❌ Error al eliminar usuarios guest expirados:", error);
    process.exit(1);
  }
};

// Verificar si la conexión a MongoDB ya está establecida
if (mongoose.connection.readyState === 0) {
  // No hay conexión activa, establecer una nueva
  const uri = process.env.DB_URI;
  mongoose
    .connect(uri)
    .then(async () => {
      console.log("✅ MongoDB connection successful");
      await runCleanup();
      await mongoose.connection.close();
      console.log("✅ Conexión a MongoDB cerrada");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
      process.exit(1);
    });
} else {
  // La conexión ya está establecida, ejecutar la limpieza directamente
  runCleanup();
}