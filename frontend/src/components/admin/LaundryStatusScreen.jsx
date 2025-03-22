import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { notesFetch, notesEdit } from "../../features/notesSlice";

const LaundryStatusScreen = () => {
  const dispatch = useDispatch();
  const { items = [], status } = useSelector((state) => state.notes);

  useEffect(() => {
    if (status !== "success") {
      dispatch(notesFetch());
    }
  }, [dispatch, status]);

  // Categorize notes by status
  const notesByStatus = {
    sucia: items.filter((note) => note.cleaning_status === "sucia"),
    lavado: items.filter((note) => note.cleaning_status === "lavado"),
    entregado: items.filter((note) => note.cleaning_status === "entregado"),
  };

  const handleChangeStatus = (note, newStatus) => {
    if (note.cleaning_status_status !== newStatus) {
      const updatedNote = { ...note, cleaning_status: newStatus };
      dispatch(notesEdit(updatedNote));
    }
  };

  return (
    <Container>
      {/* Column for 'Ropa Sucia' */}
      <Column>
        <CategoryTitle>Sucia</CategoryTitle>
        {notesByStatus.sucia.length ? (
          notesByStatus.sucia.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <Button onClick={() => handleChangeStatus(note, "lavado")}>
                Pasar a Lavado
              </Button>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa sucia.</EmptyMessage>
        )}
      </Column>

      {/* Column for 'Ropa Lavada' */}
      <Column>
        <CategoryTitle>Lavada y Doblada</CategoryTitle>
        {notesByStatus.lavado.length ? (
          notesByStatus.lavado.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <Button onClick={() => handleChangeStatus(note, "entregado")}>
                Para entregar
              </Button>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa lavada.</EmptyMessage>
        )}
      </Column>

      {/* Column for 'Ropa Entregada' */}
      <Column>
        <CategoryTitle>Entregada</CategoryTitle>
        {notesByStatus.entregado.length ? (
          notesByStatus.entregado.map((note) => (
            <NoteBox key={note._id}>
              <NoteInfo>
                <p><strong>Folio:</strong> {note.folio}</p>
                <p><strong>Nombre:</strong> {note.name}</p>
                <p><strong>Total:</strong> ${note.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
              </NoteInfo>
              <StatusText>Entregado</StatusText>
            </NoteBox>
          ))
        ) : (
          <EmptyMessage>No hay ropa entregada.</EmptyMessage>
        )}
      </Column>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  gap: 2rem;
  padding: 2rem;
  background-color: #f5f5f5;
  overflow-x: auto;
  min-height: 100vh;
`;

const Column = styled.div`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-4px);
  }

  @media (max-width: 768px) {
    flex: none;
    min-width: 300px;
  }
`;

const CategoryTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #007bff;
`;

const NoteBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  background-color: #ffffff;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;



const NoteInfo = styled.div`
  p {
    margin: 0.2rem 0;
    line-height: 1.4;
    font-size: 0.95rem;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 1rem;
  text-align: center;
  

  &:hover {
    background-color: #0056b3;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.1rem;
`;

const StatusText = styled.p`
  margin-top: 1rem;
  text-align: center;
  color: #28a745;
  font-weight: bold;
  font-size: 1.1rem;
`;

export default LaundryStatusScreen;
