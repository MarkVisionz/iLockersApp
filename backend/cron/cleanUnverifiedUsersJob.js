// backend/cron/cleanUnverifiedUsersJob.js
const cron = require("node-cron");
const path = require("path");
const { exec } = require("child_process");

// Ejecutar el script cada día a las 12:00 AM
cron.schedule("0 0 * * *", () => {
  console.log("⏰ Ejecutando limpieza de usuarios no verificados...");

  const scriptPath = path.join(__dirname, "../scripts/cleanUnverifiedUsers.js");

  exec(`node ${scriptPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Error ejecutando script:", err);
      return;
    }
    if (stderr) console.error("⚠️ STDERR:", stderr);
    if (stdout) console.log("✅ STDOUT:\n", stdout);
  });
});
