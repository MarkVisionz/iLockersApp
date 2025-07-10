import {
  serviceAdded,
  serviceUpdated,
  serviceDeleted,
  clearAllServices,
} from "../servicesSlice";
import socket from "../socket";
import { toast } from "react-toastify";

// Setup de listeners de servicios (tiempo real con Socket.IO)
const setupServiceSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("⚠️ Socket no disponible.");
    return () => {};
  }

  // 🔄 Limpiar listeners previos para evitar duplicados
  socket.off("serviceCreated");
  socket.off("serviceUpdated");
  socket.off("serviceDeleted");
  socket.off("servicesCleared");
  socket.off("servicesBulkCreated");

  // 🟢 Nuevo servicio
  const handleServiceCreated = (newService) => {
    try {
      dispatch(serviceAdded(newService));
      toast.success(`Nuevo servicio creado: ${newService.name}`);
    } catch (error) {
      console.error("Error en serviceCreated:", error);
      toast.error("Error al agregar servicio");
    }
  };

  // 🟡 Servicio actualizado
  const handleServiceUpdated = (updatedService) => {
    try {
      dispatch(serviceUpdated(updatedService));
      toast.info(`Servicio actualizado: ${updatedService.name}`);
    } catch (error) {
      console.error("Error en serviceUpdated:", error);
      toast.error("Error al actualizar servicio");
    }
  };

  // 🔴 Servicio eliminado
  const handleServiceDeleted = (deletedService) => {
    try {
      dispatch(serviceDeleted(deletedService._id));
      toast.warning(`Servicio eliminado: ${deletedService.name}`);
    } catch (error) {
      console.error("Error en serviceDeleted:", error);
      toast.error("Error al eliminar servicio");
    }
  };

  // 🚫 Todos los servicios eliminados
  const handleServicesCleared = () => {
    try {
      dispatch(clearAllServices());
      toast.warning("Todos los servicios fueron eliminados");
    } catch (error) {
      console.error("Error en servicesCleared:", error);
      toast.error("Error al limpiar servicios");
    }
  };

  // 📦 Servicios creados en bulk
  const handleBulkCreated = (createdServices) => {
    try {
      createdServices.forEach((s) => dispatch(serviceAdded(s)));
      toast.success(`Se crearon ${createdServices.length} servicios`);
    } catch (error) {
      console.error("Error en servicesBulkCreated:", error);
      toast.error("Error al crear servicios en lote");
    }
  };

  // 🎧 Registrar todos los listeners
  socket.on("serviceCreated", handleServiceCreated);
  socket.on("serviceUpdated", handleServiceUpdated);
  socket.on("serviceDeleted", handleServiceDeleted);
  socket.on("servicesCleared", handleServicesCleared);
  socket.on("servicesBulkCreated", handleBulkCreated);

  // 🧹 Cleanup para cuando se desmonta el componente
  return () => {
    socket.off("serviceCreated", handleServiceCreated);
    socket.off("serviceUpdated", handleServiceUpdated);
    socket.off("serviceDeleted", handleServiceDeleted);
    socket.off("servicesCleared", handleServicesCleared);
    socket.off("servicesBulkCreated", handleBulkCreated);
  };
};

export default setupServiceSocketListeners;
