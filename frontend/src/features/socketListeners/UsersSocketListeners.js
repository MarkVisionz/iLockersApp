import socket from "../socket";
import { userUpdated, userDeleted, userAdded } from "../usersSlice";
import { toast } from "react-toastify";

const setupUsersSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn('Socket connection not available');
    return () => {};
  }

  // Handlers con notificaciones Toast y manejo de errores
  const handleUserUpdated = (updatedUser) => {
    try {
      dispatch(userUpdated(updatedUser));
      toast.info(`Usuario actualizado: ${updatedUser.name || updatedUser.email}`);
    } catch (error) {
      toast.error('Error al actualizar usuario');
      console.error('Error handling userUpdated:', error);
    }
  };

  const handleUserDeleted = (deletedUser) => {
    try {
      dispatch(userDeleted(deletedUser));
      toast.warning(`Usuario eliminado: ${deletedUser.name || deletedUser.email}`);
    } catch (error) {
      toast.error('Error al eliminar usuario');
      console.error('Error handling userDeleted:', error);
    }
  };

  const handleUserCreated = (newUser) => {
    try {
      dispatch(userAdded(newUser));
      toast.success(`Nuevo usuario registrado: ${newUser.name || newUser.email}`);
    } catch (error) {
      toast.error('Error al agregar usuario');
      console.error('Error handling userCreated:', error);
    }
  };

  // Registrar listeners
  socket.on("userUpdated", handleUserUpdated);
  socket.on("userDeleted", handleUserDeleted);
  socket.on("userCreated", handleUserCreated);

  // Retornar función de limpieza
  return () => {
    socket.off("userUpdated", handleUserUpdated);
    socket.off("userDeleted", handleUserDeleted);
    socket.off("userCreated", handleUserCreated);
  };
};

export default setupUsersSocketListeners;