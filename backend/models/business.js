const mongoose = require("mongoose");

// Define coordinates as a nested schema
const coordinatesSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    lng: {
      type: Number,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
  },
  { _id: false }
);

// Add document-level validation for coordinates
coordinatesSchema.pre("validate", function (next) {
  if ((this.lat == null && this.lng != null) || (this.lat != null && this.lng == null)) {
    next(new Error("Se requieren latitud y longitud juntas o ninguna"));
  }
  next();
});

// Schema para los horarios de cada día
const businessDaySchema = new mongoose.Schema(
  {
    open: {
      type: String,
      match: /^([0-1]\d|2[0-3]):[0-5]\d$/,
      default: null
    },
    close: {
      type: String,
      match: /^([0-1]\d|2[0-3]):[0-5]\d$/,
      default: null
    },
    isClosed: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const BusinessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "El correo debe ser válido",
      },
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ""));
        },
        message: "El teléfono debe ser un número válido",
      },
    },
    address: {
      street: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 50 },
      postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
      },
      country: {
        type: String,
        default: "México",
        trim: true,
      },
      coordinates: {
        type: coordinatesSchema,
        default: null,
      },
    },
    logo: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          return (
            !v || /^https?:\/\/.+(\.(png|jpg|jpeg|svg|webp))(?:\?.*)?$/i.test(v)
          );
        },
        message:
          "Debe ser una URL válida de imagen (PNG, JPG, JPEG, SVG, WEBP)",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder los 500 caracteres"],
    },
    businessHours: {
      monday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      tuesday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      wednesday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      thursday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      friday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      saturday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
      sunday: {
        type: businessDaySchema,
        default: () => ({ isClosed: true })
      },
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        default: [],
      },
    ],
    subscription: {
      plan: {
        type: String,
        enum: ["starter", "pro", "enterprise"],
        default: "starter",
      },
      status: {
        type: String,
        enum: ["active", "past_due", "canceled", "unpaid", "trialing"],
        default: "unpaid",
      },
      stripeData: {
        customerId: String,
        subscriptionId: String,
        currentPeriodEnd: Date,
      },
      trialEnd: {
        type: Date,
        default: function () {
          return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        },
      },
    },
    settings: {
      currency: {
        type: String,
        default: "MXN",
        enum: ["MXN", "USD", "EUR"],
      },
      timezone: {
        type: String,
        default: "America/Mexico_City",
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      laundrySettings: {
        defaultReadyTime: {
          type: Number,
          default: 48,
          min: 1,
          max: 168,
        },
        suavitelEnabled: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentBusiness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      validate: {
        validator: async function (v) {
          if (!v) return true;
          const parent = await mongoose.model("Business").findById(v);
          return parent && parent.isActive;
        },
        message: "El negocio padre debe existir y estar activo",
      },
    },
    branches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Validación personalizada para horarios comerciales
BusinessSchema.pre("validate", function(next) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  days.forEach(day => {
    const hours = this.businessHours?.[day];
    
    if (hours) {
      // Si está cerrado, no debería tener horarios
      if (hours.isClosed && (hours.open || hours.close)) {
        this.invalidate(`businessHours.${day}`, 
          `No se deben especificar horarios cuando el negocio está cerrado (${day})`);
      }
      
      // Si no está cerrado, debe tener ambos horarios válidos
      if (!hours.isClosed) {
        if (!hours.open || !hours.close) {
          this.invalidate(`businessHours.${day}`, 
            `Se requieren horarios de apertura y cierre para ${day} o marcar como cerrado`);
        }
        
        if (hours.open && !/^([0-1]\d|2[0-3]):[0-5]\d$/.test(hours.open)) {
          this.invalidate(`businessHours.${day}.open`, 
            `Formato de hora de apertura inválido para ${day}`);
        }
        
        if (hours.close && !/^([0-1]\d|2[0-3]):[0-5]\d$/.test(hours.close)) {
          this.invalidate(`businessHours.${day}.close`, 
            `Formato de hora de cierre inválido para ${day}`);
        }
        
        // Validar que close sea después de open
        if (hours.open && hours.close && hours.open >= hours.close) {
          this.invalidate(`businessHours.${day}`, 
            `La hora de cierre debe ser posterior a la de apertura para ${day}`);
        }
      }
    }
  });
  
  next();
});

BusinessSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim().replace(/\b\w/g, (l) => l.toUpperCase());
  }
  if (this.isModified("phone") && this.phone) {
    this.phone = this.phone.replace(/[\s\-()]/g, "");
  }
  if (this.isModified("address")) {
    const addr = this.address;
    addr.city = addr.city.trim().replace(/\b\w/g, (l) => l.toUpperCase());
    addr.state = addr.state.trim().toUpperCase();
    addr.postalCode = addr.postalCode.trim();
  }
  if (this.subscription.status !== "trialing" && this.subscription.trialEnd) {
    this.subscription.trialEnd = undefined;
  }
  if (this.parentBusiness && this.branches.includes(this._id)) {
    throw new Error("Negocio no puede ser su propia sucursal");
  }
  next();
});

// Método para verificar si el negocio está abierto ahora
BusinessSchema.methods.isOpenNow = function () {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  const today = days[now.getDay()];
  const hours = this.businessHours?.[today];
  
  // Si no hay información del día o está marcado como cerrado
  if (!hours || hours.isClosed) {
    return false;
  }
  
  // Si faltan horarios (aunque isClosed sea false)
  if (!hours.open || !hours.close) {
    return false;
  }
  
  const [openHour, openMinute] = hours.open.split(":").map(Number);
  const [closeHour, closeMinute] = hours.close.split(":").map(Number);
  
  const openTime = new Date(now);
  openTime.setHours(openHour, openMinute, 0, 0);
  
  const closeTime = new Date(now);
  closeTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Manejo de horarios que pasan la medianoche
  if (closeTime <= openTime) {
    closeTime.setDate(closeTime.getDate() + 1);
    return now >= openTime || now <= closeTime;
  }
  
  return now >= openTime && now <= closeTime;
};

// Método para obtener los horarios en formato legible
BusinessSchema.methods.getFormattedHours = function() {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  return days.map(day => {
    const hours = this.businessHours[day];
    if (!hours || hours.isClosed) {
      return `${dayNames[day]}: Cerrado`;
    }
    return `${dayNames[day]}: ${hours.open} - ${hours.close}`;
  });
};

BusinessSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.postalCode}, ${this.address.country}`;
});

BusinessSchema.index({ name: "text", description: "text" });
BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ "address.city": 1, "address.state": 1 });
BusinessSchema.index({ "subscription.status": 1, "subscription.trialEnd": 1 });
BusinessSchema.index({ name: 1, ownerId: 1 }, { unique: true });
BusinessSchema.index({ isActive: 1 });

// Prevent model redefinition
module.exports = mongoose.models.Business || mongoose.model("Business", BusinessSchema);