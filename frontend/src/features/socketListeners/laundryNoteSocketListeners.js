import socket from "../socket";
import { noteAdded, noteUpdated, noteDeleted, updateStats } from "../notesSlice";
import { toast } from "react-toastify";

const setupLaundrySocketListeners = (dispatch) => {
  if (!socket) {
    console.warn("Socket connection not available");
    return () => {};
  }

  // Remove existing listeners to prevent duplicates
  socket.off("noteCreated");
  socket.off("noteUpdated");
  socket.off("noteDeleted");
  socket.off("laundryStatsUpdated");

  const handleNoteCreated = (eventData) => {
    const newNote = eventData.data || eventData;
    console.log("Socket: noteCreated", {
      _id: newNote._id,
      folio: newNote.folio,
      name: newNote.name,
      fullData: newNote,
    });
    dispatch(noteAdded(newNote));
    toast.success(`Nueva nota de lavandería creada: ${newNote.folio || "Sin folio"}`);
  };

  const handleNoteUpdated = (eventData) => {
    const updatedNote = eventData.data || eventData;
    console.log("Socket: noteUpdated", {
      _id: updatedNote._id,
      folio: updatedNote.folio,
      name: updatedNote.name,
      fullData: updatedNote,
    });
    dispatch(noteUpdated(updatedNote));
    toast.info(`Nota actualizada: ${updatedNote.folio || "Sin folio"}`);
  };

  const handleNoteDeleted = (eventData) => {
    const deletedNote = eventData.data || eventData;
    console.log("Socket: noteDeleted", {
      _id: deletedNote._id,
      folio: deletedNote.folio,
      name: deletedNote.name,
      fullData: deletedNote,
    });
    dispatch(noteDeleted(deletedNote));
    toast.warning(`Nota eliminada: ${deletedNote.folio || "Sin folio"}`);
  };

  const handleStatsUpdated = ({ type, data }) => {
    console.log("Socket: laundryStatsUpdated", { type, data });
    dispatch(updateStats({ type, data }));
  };

  socket.on("noteCreated", handleNoteCreated);
  socket.on("noteUpdated", handleNoteUpdated);
  socket.on("noteDeleted", handleNoteDeleted);
  socket.on("laundryStatsUpdated", handleStatsUpdated);

  socket.on("connect", () => {
    console.log("Socket connected");
    toast.info("Conectado al servidor en tiempo real");
  });

  socket.on("disconnect", () => {
    console.warn("Socket disconnected");
    toast.warn("Desconectado del servidor. Intentando reconectar...");
  });

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