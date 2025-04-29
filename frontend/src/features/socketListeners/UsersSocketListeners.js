import socket from "../socket";
import { 
  userUpdated, 
  userDeleted, 
  userAdded,
  setCurrentGuest
} from "../usersSlice";
import { toast } from "react-toastify";

const setupUsersSocketListeners = (dispatch) => {
  if (!socket) {
    console.warn('Socket connection not available');
    return () => {};
  }

  const handleUserUpdated = (updatedUser) => {
    try {
      dispatch(userUpdated(updatedUser));
      if (updatedUser.isGuest) {
        toast.info(`Guest user updated: ${updatedUser.guestId.slice(-4)}`);
      } else {
        toast.info(`Usuario actualizado: ${updatedUser.name || updatedUser.email}`);
      }
    } catch (error) {
      toast.error('Error al actualizar usuario');
      console.error('Error handling userUpdated:', error);
    }
  };

  const handleUserDeleted = (deletedUser) => {
    try {
      dispatch(userDeleted(deletedUser));
      if (deletedUser.isGuest) {
        toast.warning(`Guest user session terminated`);
      } else {
        toast.warning(`Usuario eliminado: ${deletedUser.name || deletedUser.email}`);
      }
    } catch (error) {
      toast.error('Error al eliminar usuario');
      console.error('Error handling userDeleted:', error);
    }
  };

  const handleUserCreated = (newUser) => {
    try {
      if (newUser.isGuest) {
        dispatch(setCurrentGuest(newUser));
        toast.success(`Sesión de invitado creada`);
      } else {
        dispatch(userAdded(newUser));
        toast.success(`Nuevo usuario registrado: ${newUser.name || newUser.email}`);
      }
    } catch (error) {
      toast.error('Error al agregar usuario');
      console.error('Error handling userCreated:', error);
    }
  };

  const handleGuestConverted = (convertedUser) => {
    try {
      dispatch(userUpdated(convertedUser));
      dispatch(setCurrentGuest(null));
      toast.success(`¡Cuenta convertida a usuario regular!`);
    } catch (error) {
      toast.error('Error al convertir usuario');
      console.error('Error handling guestConverted:', error);
    }
  };

  socket.on("userUpdated", handleUserUpdated);
  socket.on("userDeleted", handleUserDeleted);
  socket.on("userCreated", handleUserCreated);
  socket.on("guestConverted", handleGuestConverted);

  return () => {
    socket.off("userUpdated", handleUserUpdated);
    socket.off("userDeleted", handleUserDeleted);
    socket.off("userCreated", handleUserCreated);
    socket.off("guestConverted", handleGuestConverted);
  };
};

export default setupUsersSocketListeners;