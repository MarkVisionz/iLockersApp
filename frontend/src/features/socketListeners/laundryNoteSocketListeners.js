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

  // Remove existing listeners to prevent duplicates
  socket.off("noteCreated");
  socket.off("noteUpdated");
  socket.off("noteDeleted");
  socket.off("laundryStatsUpdated");

  // Handlers con notificaciones toast
  const handleNoteCreated = (newNote) => {
    console.log("Socket: noteCreated", newNote._id, newNote.folio);
    dispatch(noteAdded(newNote));
    toast.success(`Nueva nota de lavandería creada: ${newNote.folio}`);
  };

  const handleNoteUpdated = (updatedNote) => {
    console.log("Socket: noteUpdated", updatedNote._id, updatedNote.folio);
    dispatch(noteUpdated(updatedNote));
    toast.info(`Nota actualizada: ${updatedNote.name}`);
  };

  const handleNoteDeleted = (deletedNote) => {
    console.log("Socket: noteDeleted", deletedNote._id, deletedNote.folio);
    dispatch(noteDeleted(deletedNote));
    toast.warning(`Nota eliminada: ${deletedNote.name}`);
  };

  const handleStatsUpdated = ({ type, data }) => {
    console.log("Socket: laundryStatsUpdated", type);
    dispatch(updateStats({ type, data }));
  };

  // Registrar listeners
  socket.on("noteCreated", handleNoteCreated);
  socket.on("noteUpdated", handleNoteUpdated);
  socket.on("noteDeleted", handleNoteDeleted);
  socket.on("laundryStatsUpdated", handleStatsUpdated);

  // Handle connection events
  socket.on("connect", () => {
    console.log("Socket connected");
    toast.info("Conectado al servidor en tiempo real");
  });

  socket.on("disconnect", () => {
    console.warn("Socket disconnected");
    toast.warn("Desconectado del servidor. Intentando reconectar...");
  });

  // Retornar función de limpieza
  return () => {
    socket.off("noteCreated", handleNoteCreated);
    socket.off("noteUpdated", handleNoteUpdated);
    socket.off("noteDeleted", handleNoteDeleted);
    socket.off("laundryStatsUpdated", handleStatsUpdated);
    socket.off("connect");
    socket.off("disconnect");
  };
};

export default setupLaundrySocketListeners;