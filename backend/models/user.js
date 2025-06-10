const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  postal_code: { type: String, required: true },
  country: { type: String, default: "MX" },
  phone: { type: String },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: function () {
        return !this.isGuest;
      },
      default: function () {
        return this.isGuest ? "Invitado" : undefined;
      },
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return !this.isGuest;
      },
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          // Permitir undefined para guests
          if (v === undefined || v === null) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} no es un email válido!`,
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.isGuest && this.authProvider === "password";
      },
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "owner", "employee"],
      default: "customer",
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: function () {
        return this.role === "owner" || this.role === "employee";
      },
    },
    profileImage: {
      type: String,
      default: "",
    },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ["password", "google.com", "facebook.com", "guest"],
      required: true,
      default: "password",
    },
    isGuest: { type: Boolean, default: false },
    guestExpiresAt: {
      type: Date,
      default: function () {
        return this.isGuest
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : undefined;
      },
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Middleware para hashear la password
userSchema.pre("save", async function (next) {
  try {
    // No hashear si es guest, oauth o password no modificada
    if (
      this.isGuest ||
      this.authProvider !== "password" ||
      !this.isModified("password")
    ) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Métodos del modelo
userSchema.methods = {
  comparePassword: async function (candidatePassword) {
    if (this.isGuest || this.authProvider !== "password") return false;
    return await bcrypt.compare(candidatePassword, this.password);
  },

  convertToRegular: async function (email, password) {
    if (!this.isGuest)
      throw new Error("Solo cuentas guest pueden ser convertidas");

    // Validar email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email inválido");
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email, isGuest: false });
    if (existingUser) throw new Error("El email ya está registrado");

    // Convertir a usuario regular
    this.isGuest = false;
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.authProvider = "password";
    this.guestExpiresAt = undefined;

    return await this.save();
  },
};

// Índices para mejor performance
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isGuest: { $eq: false } }
  }
);
userSchema.index({ role: 1, businessId: 1 });
userSchema.index({ "addresses.isDefault": 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
