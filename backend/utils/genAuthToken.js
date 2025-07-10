const jwt = require("jsonwebtoken");

const genAuthToken = (user) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  const token = jwt.sign(
    {
      _id: user._id,
      name: user.name || undefined,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role, // Añadir role
      registrationStep: user.registrationStep, // Añadir registrationStep
      authProvider: user.authProvider, // Añadir authProvider
      isVerified: user.isVerified, // Añadir isVerified
    },
    jwtSecretKey,
    { expiresIn: "7d" } // Especificar tiempo de expiración explícitamente
  );

  console.log("Payload para token:", {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    role: user.role,
    registrationStep: user.registrationStep,
    authProvider: user.authProvider,
    isVerified: user.isVerified,
  }); // Depuración

  return token;
};

module.exports = genAuthToken;