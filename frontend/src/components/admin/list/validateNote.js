export const validateName = (name) => {
  if (typeof name !== "string" || !name.trim()) {
    return "El nombre es obligatorio.";
  }
  return null;
};

export const validateServices = (services) => {
  if (!services || typeof services !== "object") {
    return "Debes seleccionar al menos un servicio.";
  }
  const hasService = Object.entries(services).some(([key, value]) => {
    if (typeof value === "object") {
      return Object.values(value).some((qty) => qty > 0);
    }
    return value > 0;
  });
  return hasService ? null : "Debes seleccionar al menos un servicio.";
};

export const validateAbono = (abono, total) => {
  if (typeof abono !== "number" || abono < 0) {
    return "El abono no puede ser negativo.";
  }
  if (abono > total && total > 0) {
    return "El abono no puede ser mayor al total.";
  }
  return null;
};

export const validate = (name, abono, services) => {
  const errors = {};
  const nameError = validateName(name);
  const servicesError = validateServices(services);
  const abonoError = validateAbono(abono, services);

  if (nameError) errors.name = nameError;
  if (servicesError) errors.noService = servicesError;
  if (abonoError) errors.abono = abonoError;

  return errors;
};