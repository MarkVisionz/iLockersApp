const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es requerido"],
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} no es un email válido!`,
      },
    },
    password: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    loginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// 🔐 Hash de password, excepto para login social
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  if (this.password === "firebase_oauth") return next();

  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

// Métodos de instancia
userSchema.methods = {
  comparePassword: function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  },
  incrementLoginAttempts: function () {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.isLocked = true;
      this.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    return this.save();
  },
  resetLoginAttempts: function () {
    this.loginAttempts = 0;
    this.isLocked = false;
    this.lockUntil = undefined;
    return this.save();
  },
  isAccountLocked: function () {
    return this.isLocked && this.lockUntil > Date.now();
  },
};

const User = mongoose.model("User", userSchema);
module.exports = User; // no destructures con {}
