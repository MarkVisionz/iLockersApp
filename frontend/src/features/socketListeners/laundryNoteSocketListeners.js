import socket from "../socket";
import { 
  noteAdded, 
  noteUpdated, 
  noteDeleted, 
  updateStats 
} from "../notesSlice";
import { toast } from "react-toastify";

const setupLaundrySocketListeners = (dispatch) => {
  if (!socket) {
    console.warn('Socket connection not available');
    return () => {};
  }

  // Handlers con notificaciones toast
  const handleNoteCreated = (newNote) => {
    dispatch(noteAdded(newNote));
    toast.success(`Nueva nota de lavandería creada: ${newNote._id}`);
  };

  const handleNoteUpdated = (updatedNote) => {
    dispatch(noteUpdated(updatedNote));
    toast.info(`Nota actualizada: ${updatedNote.name}`);
  };

  const handleNoteDeleted = (deletedNote) => {
    dispatch(noteDeleted(deletedNote));
    toast.warning(`Nota eliminada: ${deletedNote.name}`);
  };

  const handleStatsUpdated = ({ type, data }) => {
    dispatch(updateStats({ type, data }));
  };

  // Registrar listeners
  socket.on("noteCreated", handleNoteCreated);
  socket.on("noteUpdated", handleNoteUpdated);
  socket.on("noteDeleted", handleNoteDeleted);
  socket.on("laundryStatsUpdated", handleStatsUpdated);

  // Retornar función de limpieza
  return () => {
    socket.off("noteCreated", handleNoteCreated);
    socket.off("noteUpdated", handleNoteUpdated);
    socket.off("noteDeleted", handleNoteDeleted);
    socket.off("laundryStatsUpdated", handleStatsUpdated);
  };
};

export default setupLaundrySocketListeners;