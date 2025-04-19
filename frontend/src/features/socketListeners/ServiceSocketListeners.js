// setupServiceSocketListeners.js
import {
  serviceAdded,
  serviceUpdated,
  serviceDeleted,
  clearAllServices,
} from "../servicesSlice";
import socket from "../socket";
import { toast } from "react-toastify";

const setupServiceSocketListeners = (dispatch) => {
  socket.on("serviceCreated", (newService) => {
    dispatch(serviceAdded(newService));
    toast.success(`Nuevo servicio: ${newService.name}`);
  });

  socket.on("serviceUpdated", (updatedService) => {
    dispatch(serviceUpdated(updatedService));
    toast.info(`Servicio actualizado: ${updatedService.name}`);
  });

  socket.on("serviceDeleted", (deletedService) => {
    dispatch(serviceDeleted(deletedService._id));
    toast.warning(`Servicio eliminado: ${deletedService.name}`);
  });

  socket.on("servicesCleared", () => {
    dispatch(clearAllServices());
    toast.warning("Todos los servicios fueron eliminados");
  });

  socket.on("servicesBulkCreated", (createdServices) => {
    createdServices.forEach((service) => {
      dispatch(serviceAdded(service));
    });

    toast.success(`Se crearon ${createdServices.length} servicios correctamente`);
  });
};

export default setupServiceSocketListeners;
