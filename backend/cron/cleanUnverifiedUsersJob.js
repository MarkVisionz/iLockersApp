const cron = require("node-cron");
const path = require("path");
const { exec } = require("child_process");

// Ejecutar limpieza de usuarios no verificados y guest expirados cada día a las 12:00 AM
cron.schedule("0 0 * * *", () => {
  console.log("⏰ Ejecutando limpieza de usuarios no verificados y guests...");

  // Limpieza de usuarios no verificados
  const unverifiedScriptPath = path.join(__dirname, "../scripts/cleanUnverifiedUsers.js");
  exec(`node ${unverifiedScriptPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error ejecutando script de usuarios no verificados:", err);
      return;
    }
    if (stderr) console.error("⚠️ STDERR (no verificados):", stderr);
    if (stdout) console.log("✅ STDOUT (no verificados):\n", stdout);
  });

  // Limpieza de usuarios guest expirados
  const guestScriptPath = path.join(__dirname, "../scripts/cleanGuestUsers.js");
  exec(`node ${guestScriptPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error ejecutando script de usuarios guest:", err);
      return;
    }
    if (stderr) console.error("⚠️ STDERR (guests):", stderr);
    if (stdout) console.log("✅ STDOUT (guests):\n", stdout);
  });
});