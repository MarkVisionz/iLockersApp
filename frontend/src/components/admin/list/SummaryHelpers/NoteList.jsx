// NoteList.js
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
              <NoteName>Name: {note.name}</NoteName>
              <NoteAmount>Amount: ${note.total}</NoteAmount>
              <NoteStatus>Status: {renderStatus(note.note_status)}</NoteStatus>
              <NoteDate>
                {moment(note.date).format("YYYY-MM-DD HH:mm")}
              </NoteDate>
            </NoteInfo>
            <Actions>
              <DispatchBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDispatch(note._id);
                }}
              >
                Dispatch
              </DispatchBtn>
              <DeliveryBtn
                onClick={(e) => {
                  e.stopPropagation();
                  onDeliver(note._id);
                }}
              >
                Deliver
              </DeliveryBtn>
            </Actions>
          </NoteBox>
        ))
      ) : (
        <NoNotes>No notes found.</NoNotes>
      )}
    </NoteContainer>
  );
};

const renderStatus = (status) => {
  switch (status) {
    case "pendiente":
      return <Pending>Pending</Pending>;
    case "pagado":
      return <Dispatched>Dispatched</Dispatched>;
    case "entregado":
      return <Delivered>Delivered</Delivered>;
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
  transition: box-shadow 0.3s ease;
  background-color: white;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
`;

const NoteName = styled.p`
  margin: 0 0 0.5rem;
`;

const NoteAmount = styled.p`
  margin: 0 0 0.5rem;
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
  font-size: 15px;
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
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
  }

  &:focus {
    outline: none;
  }
`;

const DeliveryBtn = styled.button`
  background-color: rgb(102, 108, 255);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgb(82, 85, 167);
  }

  &:focus {
    outline: none;
  }
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 0.9rem;
`;

const Dispatched = styled.span`
  color: rgb(38, 198, 249);
  background-color: rgba(38, 198, 249, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 0.9rem;
`;

const Delivered = styled.span`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 0.9rem;
`;

const NoNotes = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
`;

export default NoteList;
