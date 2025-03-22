import React from "react";
import styled from "styled-components";
import moment from "moment";

const NoteList = ({ notes, onView, onDispatch, onDeliver }) => {
  return (
    <NoteContainer>
      {notes.length ? (
        notes.map((note) => (
          <NoteBox key={note._id} onClick={() => onView(note._id)}>
            <NoteInfo>
              <NoteId>Folio: {note.folio}</NoteId>
              <NoteName>Nombre: {note.name}</NoteName>
              <NoteAmount>Total: ${note.total.toFixed(2)}</NoteAmount>
              <NoteStatus>{renderStatus(note.note_status)}</NoteStatus>
              <NoteDate>
                Date: {moment(note.date).format("YYYY-MM-DD HH:mm")}
              </NoteDate>
            </NoteInfo>
            <Actions>
              <DispatchBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDispatch(note._id);
                }}
                disabled={note.paidAt} // Desactiva el botón si ya se registró el pago
              >
                Pagar
              </DispatchBtn>
              <DeliveryBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDeliver(note._id);
                }}
                disabled={note.deliveredAt} // Desactiva el botón si ya se registró la entrega
              >
                Entregar
              </DeliveryBtn>
            </Actions>
          </NoteBox>
        ))
      ) : (
        <NoNotes>No se encontraron notas.</NoNotes>
      )}
    </NoteContainer>
  );
};

const renderStatus = (status) => {
  switch (status) {
    case "pendiente":
      return <Pending>Pendiente</Pending>;
    case "pagado":
      return <Dispatched>Pagado</Dispatched>;
    case "entregado":
      return <Delivered>Entregado</Delivered>;
    default:
      return "Error";
  }
};

// Styled Components
const NoteContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoteBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: white;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const NoteInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const NoteId = styled.p`
  margin: 0 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const NoteName = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
`;

const NoteAmount = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
`;

const NoteStatus = styled.p`
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  font-weight: bold;
`;

const NoteDate = styled.p`
  margin: 0;
  font-weight: lighter;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 1rem;
    flex-direction: row;
  }
`;

const DispatchBtn = styled.button`
  background-color: rgb(0, 123, 255);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
 border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DeliveryBtn = styled.button`
  color: white;
  background-color: #28a745;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #218838;  /* Un verde más oscuro para el hover */
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;


const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Dispatched = styled.span`
  color: rgb(0, 123, 255);
  background: rgba(0, 123, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Delivered = styled.span`
  color: rgb(40, 167, 69);
  background: rgba(40, 167, 69, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const NoNotes = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
`;

export default NoteList;