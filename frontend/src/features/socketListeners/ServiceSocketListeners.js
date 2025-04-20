// setupServiceSocketListeners.js - Versión optimizada
import {
  serviceAdded,
  serviceUpdated,
  serviceDeleted,
  clearAllServices,
} from "../servicesSlice";
import socket from "../socket";
import { toast } from "react-toastify";

const setupServiceSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("Socket no está disponible");
    return () => {};
  }

  // Handlers específicos
  const handleServiceCreated = (newService) => {
    dispatch(serviceAdded(newService));
    toast.success(`Nuevo servicio: ${newService.name}`);
  };

  const handleServiceUpdated = (updatedService) => {
    dispatch(serviceUpdated(updatedService));
    toast.info(`Servicio actualizado: ${updatedService.name}`);
  };

  const handleServiceDeleted = (deletedService) => {
    dispatch(serviceDeleted(deletedService._id));
    toast.warning(`Servicio eliminado: ${deletedService.name}`);
  };

  const handleServicesCleared = () => {
    dispatch(clearAllServices());
    toast.warning("Todos los servicios fueron eliminados");
  };

  const handleBulkCreated = (createdServices) => {
    createdServices.forEach((service) => {
      dispatch(serviceAdded(service));
    });
    toast.success(`Se crearon ${createdServices.length} servicios correctamente`);
  };

  // Registrar listeners
  socket.on("serviceCreated", handleServiceCreated);
  socket.on("serviceUpdated", handleServiceUpdated);
  socket.on("serviceDeleted", handleServiceDeleted);
  socket.on("servicesCleared", handleServicesCleared);
  socket.on("servicesBulkCreated", handleBulkCreated);

  // Retornar función de limpieza
  return () => {
    socket.off("serviceCreated", handleServiceCreated);
    socket.off("serviceUpdated", handleServiceUpdated);
    socket.off("serviceDeleted", handleServiceDeleted);
    socket.off("servicesCleared", handleServicesCleared);
    socket.off("servicesBulkCreated", handleBulkCreated);
  };
};

export default setupServiceSocketListeners;