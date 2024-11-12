// validation.js
export const validateName = (name) => {
    if (!name.trim()) return "El nombre del cliente es obligatorio";
    return null;
  };
  
  export const validateAbono = (abono) => {
    if (abono < 0) return "El abono no puede ser negativo";
    return null;
  };
  
  export const validateServices = (services) => {
    const errors = {};
    let hasService = false;
  
    for (const service in services) {
      if (typeof services[service] === "object") {
        for (const size in services[service]) {
          if (services[service][size] < 0) {
            errors[service] = "La cantidad no puede ser negativa";
          } else if (services[service][size] > 0) {
            hasService = true;
          }
        }
      } else {
        if (services[service] < 0) {
          errors[service] = "El valor no puede ser negativo";
        } else if (services[service] > 0) {
          hasService = true;
        }
      }
    }
  
    if (!hasService) errors.noService = "Debe seleccionar al menos un servicio.";
    return { errors, hasService };
  };
  
  export const validate = (name, abono, services) => {
    const errors = {};
    const nameError = validateName(name);
    const abonoError = validateAbono(abono);
    const { errors: serviceErrors } = validateServices(services);
  
    if (nameError) errors.name = nameError;
    if (abonoError) errors.abono = abonoError;
  
    return { ...errors, ...serviceErrors };
  };