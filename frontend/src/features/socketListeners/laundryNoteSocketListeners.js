import socket from "../socket";
import { noteAdded, noteUpdated, noteDeleted, updateStats } from "../notesSlice";

const setupLaundrySocketListeners = (dispatch) => {
  if (!socket) return;

  // Evento: Nota creada
  socket.on("noteCreated", (newNote) => {
    dispatch(noteAdded(newNote));
  });

  // Evento: Nota actualizada
  socket.on("noteUpdated", (updatedNote) => {
    dispatch(noteUpdated(updatedNote));
  });

  // Evento: Nota eliminada
  socket.on("noteDeleted", (deletedNote) => {
    dispatch(noteDeleted(deletedNote));
  });

  // Evento: Estadísticas de lavandería actualizadas
  socket.on("laundryStatsUpdated", ({ type, data }) => {
    dispatch(updateStats({ type, data }));
  });
};

export default setupLaundrySocketListeners;