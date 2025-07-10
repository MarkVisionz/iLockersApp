import socket from "../socket";
import {
  businessAdded,
  businessUpdated,
  businessDeleted,
  setDefaultBusiness,
  clearBusinessState,
} from "../businessSlice";
import { businessDeleted as authBusinessDeleted } from "../authSlice";
import { resetNotes } from "../notesSlice";
import { resetServices } from "../servicesSlice";
import { toast } from "react-toastify";

// Store registered listeners to prevent duplicates
const registeredListeners = new Set();

const setupBusinessSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("Socket connection not available");
    return () => {};
  }

  const handleBusinessCreated = (newBusiness) => {
    try {
      console.log("Socket: businessCreated", newBusiness._id, newBusiness.name);
      dispatch(businessAdded(newBusiness));
      dispatch(setDefaultBusiness(newBusiness));
      toast.success(`Nuevo negocio creado: ${newBusiness.name || "Sin nombre"}`);
    } catch (error) {
      console.error("Error al manejar negocio creado:", error);
    }
  };

  const handleBusinessUpdated = (eventData) => {
    try {
      const updatedBusiness = eventData.data || eventData;
      console.log("Socket: businessUpdated", {
        _id: updatedBusiness._id,
        name: updatedBusiness.name,
        fullData: updatedBusiness,
      });
      dispatch(businessUpdated(updatedBusiness));
      dispatch(setDefaultBusiness(updatedBusiness));
      toast.info(`Negocio actualizado: ${updatedBusiness.name || "Sin nombre"}`);
    } catch (error) {
      console.error("Error al manejar negocio actualizado:", error);
    }
  };

  const handleBusinessDeleted = ({ businessId }) => {
    try {
      console.log("Socket: businessDeleted", businessId);
      dispatch(businessDeleted(businessId));
      dispatch(authBusinessDeleted(businessId));
      dispatch(resetNotes());
      dispatch(resetServices());
      dispatch(clearBusinessState());
      toast.warning("Negocio eliminado");
    } catch (error) {
      console.error("Error al manejar negocio eliminado:", error);
    }
  };

  // Register socket events only if not already registered
  if (!registeredListeners.has("businessCreated")) {
    socket.on("businessCreated", handleBusinessCreated);
    registeredListeners.add("businessCreated");
  }
  if (!registeredListeners.has("businessUpdated")) {
    socket.on("businessUpdated", handleBusinessUpdated);
    registeredListeners.add("businessUpdated");
  }
  if (!registeredListeners.has("businessDeleted")) {
    socket.on("businessDeleted", handleBusinessDeleted);
    registeredListeners.add("businessDeleted");
  }

  // Cleanup
  return () => {
    socket.off("businessCreated", handleBusinessCreated);
    socket.off("businessUpdated", handleBusinessUpdated);
    socket.off("businessDeleted", handleBusinessDeleted);
    registeredListeners.delete("businessCreated");
    registeredListeners.delete("businessUpdated");
    registeredListeners.delete("businessDeleted");
  };
};

export default setupBusinessSocketListeners;