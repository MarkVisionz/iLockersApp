const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true, trim: true, maxlength: 200 },
  line2: { type: String, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  postal_code: { type: String, required: true, trim: true, maxlength: 20 },
  country: { type: String, default: "MX", trim: true },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        const cleaned = v.replace(/[\s\-()]/g, "");
        return /^\+?\d{7,15}$/.test(cleaned);
      },
      message: "El teléfono debe ser un número válido",
    },
  },
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
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
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
          if (this.isGuest) return true;
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
      minlength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "owner", "employee"],
      default: "customer",
      required: true,
    },
    businesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      validate: {
        validator: function (v) {
          // Permitir businesses vacío si registrationStep es "business_setup"
          if (this.registrationStep === "business_setup" && v.length === 0) {
            return true;
          }
          // Los clientes no pueden tener negocios
          if (this.role === "customer" && v.length > 0) {
            return false;
          }
          // Los dueños/empleados deben tener al menos un negocio, salvo en business_setup
          if (["owner", "employee"].includes(this.role) && v.length === 0 && this.registrationStep !== "business_setup") {
            return false;
          }
          return true;
        },
        message: "Los clientes no pueden estar asociados a negocios, y los dueños/empleados deben tener al menos un negocio",
      },
    }],
    defaultBusiness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
    },
    profileImage: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(v);
        },
        message: "La imagen debe ser una URL válida",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    registrationStep: {
      type: String,
      enum: ["email_verification", "business_setup", "completed"],
      default: "email_verification",
    },
    authProvider: {
      type: String,
      enum: ["password", "google.com", "facebook.com", "guest"],
      required: true,
      default: "password",
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestExpiresAt: {
      type: Date,
      default: function () {
        return this.isGuest ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined;
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
    firebaseUid: {
      type: String,
      sparse: true,
      unique: true,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      language: {
        type: String,
        enum: ["es", "en"],
        default: "es",
      },
    },
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

userSchema.pre("save", async function (next) {
  try {
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

userSchema.pre("save", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("name") && this.name) {
    this.name = this.name.trim().replace(/\b\w/g, (l) => l.toUpperCase());
  }
  next();
});

userSchema.methods = {
  comparePassword: async function (candidatePassword) {
    if (this.isGuest || this.authProvider !== "password") return false;
    return await bcrypt.compare(candidatePassword, this.password);
  },
  convertToRegular: async function (email, password) {
    if (!this.isGuest) throw new Error("Solo cuentas guest pueden ser convertidas");
    const emailExists = await this.constructor.findOne({
      email: email.toLowerCase().trim(),
      isGuest: false,
    });
    if (emailExists) throw new Error("El email ya está registrado");
    this.isGuest = false;
    this.email = email.toLowerCase().trim();
    this.password = password;
    this.authProvider = "password";
    this.guestExpiresAt = undefined;
    return await this.save();
  },
  isBusinessOwner: function (businessId) {
    return this.role === "owner" && this.businesses.includes(businessId);
  },
  addBusiness: async function (businessId) {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("ID de negocio inválido");
    }
    if (!this.businesses.includes(businessId)) {
      this.businesses.push(businessId);
      if (this.registrationStep === "email_verification") {
        this.registrationStep = "business_setup";
      }
      await this.save();
    }
    return this;
  },
};

userSchema.virtual("activeBusinesses", {
  ref: "Business",
  localField: "businesses",
  foreignField: "_id",
  match: { isActive: true },
});

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isGuest: false } });
userSchema.index({ role: 1 });
userSchema.index({ businesses: 1 });
userSchema.index({ "addresses.isDefault": 1 });
userSchema.index({ firebaseUid: 1 }, { sparse: true });
userSchema.index({ lastLogin: -1 });
userSchema.index({ registrationStep: 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;