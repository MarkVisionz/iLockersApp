// scripts/cleanUnverifiedUsers.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
dotenv.config();

const serviceAccountPath = path.join(__dirname, "../utils/firebase-admin.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const deleteUnverifiedUsers = async (hours = 48) => {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  let nextPageToken;
  let totalDeleted = 0;

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const unverified = listUsersResult.users.filter((userRecord) => {
      return (
        !userRecord.emailVerified &&
        new Date(userRecord.metadata.creationTime).getTime() < cutoff
      );
    });

    for (const user of unverified) {
      try {
        await admin.auth().deleteUser(user.uid);
        console.log(`🗑️ Usuario eliminado: ${user.email}`);
        totalDeleted++;
      } catch (err) {
        console.error(`❌ Error al eliminar ${user.email}:`, err.message);
      }
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`\n✅ Limpieza completada. Total eliminados: ${totalDeleted}`);
};

deleteUnverifiedUsers(48).catch((err) => {
  console.error("❌ Error general:", err);
});
