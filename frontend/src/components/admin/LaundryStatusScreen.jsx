import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { notesFetch, notesEdit } from "../../features/notesSlice";
import { toast } from "react-toastify";

const LaundryStatusScreen = () => {
  const dispatch = useDispatch();
  const { items = [], status, editStatus } = useSelector((state) => state.notes);

  useEffect(() => {
    if (status !== "success") {
      dispatch(notesFetch());
    }
  }, [dispatch, status]);

  const notesByStatus = {
    sucia: items.filter((note) => note.cleaning_status === "sucia"),
    lavado: items.filter((note) => note.cleaning_status === "lavado"),
    listo_para_entregar: items.filter((note) => note.cleaning_status === "listo_para_entregar"),
  };

  const handleChangeStatus = async (note, newStatus) => {
    if (note.cleaning_status === newStatus) return;

    console.log("Changing cleaning_status:", {
      folio: note.folio,
      note_status: note.note_status,
      paidAt: note.paidAt,
      currentCleaningStatus: note.cleaning_status,
      newCleaningStatus: newStatus,
    });

    try {
      const payload = { _id: note._id, cleaning_status: newStatus };
      await dispatch(notesEdit(payload)).unwrap();
      toast.success(`Estado actualizado a ${newStatus === "lavado" ? "Lavado" : "Listo para Entregar"}`);

      if (newStatus === "listo_para_entregar" && note.phoneNumber) {
        const msg = `👕 Hola ${note.name}, tu ropa ya está lista para recoger.`;
        const waUrl = `https://wa.me/${note.phoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }
    } catch (error) {
      console.error("Error updating cleaning_status:", error);
      toast.error(error.message || "Error al actualizar el estado. Intenta de nuevo.");
    }
  };

  return (
    <Container>
      {/* SUCIA */}
      <Column>
        <CategoryTitle>Sucia</CategoryTitle>
        {notesByStatus.sucia.length ? (
          notesByStatus.sucia.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> {note.note_status === "pagado" ? "Pagado" : "Pendiente"}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <Button
                onClick={() => handleChangeStatus(note, "lavado")}
                disabled={editStatus === "pending"}
                title="Pasar la ropa a Lavado"
              >
                {editStatus === "pending" ? "Actualizando..." : "Pasar a Lavado"}
              </Button>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa sucia.</EmptyMessage>
        )}
      </Column>

      {/* LAVADO */}
      <Column>
        <CategoryTitle>Lavado/Secado</CategoryTitle>
        {notesByStatus.lavado.length ? (
          notesByStatus.lavado.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> {note.note_status === "pagado" ? "Pagado" : "Pendiente"}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <Button
                onClick={() => handleChangeStatus(note, "listo_para_entregar")}
                disabled={editStatus === "pending"}
                title="Marcar como Listo para Entregar"
              >
                {editStatus === "pending" ? "Actualizando..." : "Listo para Entregar"}
              </Button>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa lavada.</EmptyMessage>
        )}
      </Column>

      {/* LISTO PARA ENTREGAR */}
      <Column>
        <CategoryTitle>Listo para Entregar</CategoryTitle>
        {notesByStatus.listo_para_entregar.length ? (
          notesByStatus.listo_para_entregar.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> {note.note_status === "pagado" ? "Pagado" : "Pendiente"}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <Button
                onClick={() => alert("El cliente debe ser marcado como entregado en la parte de administración.")}
                disabled={editStatus === "pending"}
                title="Marcar como recogido por el cliente"
              >
                Cliente Recogió
              </Button>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa lista para entregar.</EmptyMessage>
        )}
      </Column>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 1.5rem auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: auto;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    margin: 1rem;
  }
`;

const Column = styled.div`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex: none;
    min-width: 100%;
  }
`;

const CategoryTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
`;

const NoteBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const NoteInfo = styled.div`
  p {
    margin: 0.3rem 0;
    line-height: 1.5;
    font-size: 1rem;
    color: #333;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.5rem;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #888;
  font-size: 1rem;
  margin: 1.5rem 0;
`;

export default LaundryStatusScreen;