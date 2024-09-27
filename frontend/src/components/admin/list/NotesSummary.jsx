import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment"; // Asegúrate de importar moment.js correctamente
import { useNavigate } from "react-router-dom";
import { notesFetch, notesEdit } from "../../../features/notesSlice";

const NotesSummary = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], status } = useSelector((state) => state.notes);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [onlyShow, setOnlyShow] = useState("");
  const itemsPerPage = 4;

  useEffect(() => {
    if (status !== "success") {
      dispatch(notesFetch());
    }
  }, [dispatch, status]);

  useEffect(() => {
    let filtered = items.filter(
      (note) =>
        note.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.total.toString().includes(searchQuery) ||
        note.folio.includes(searchQuery)
    );
  
    if (onlyShow) {
      if (onlyShow === "day") {
        // Obtenemos el inicio del día actual en UTC
        const today = moment.utc().startOf("day");
        
        filtered = filtered.filter((note) => {
          // Convertimos la fecha de la nota a UTC y la comparamos con el día actual
          const noteDate = moment.utc(note.date).startOf("day");
          return noteDate.isSame(today, 'day'); // Comparación de fecha exacta en UTC
        });
      } else {
        // Filtrar por otros estados: pending, dispatched, delivered
        filtered = filtered.filter((note) => note.note_status === onlyShow);
      }
    }
  
    if (sortField) {
      filtered = filtered.sort((a, b) => {
        if (sortField === "date") {
          return sortOrder === "desc"
            ? new Date(b.date) - new Date(a.date)
            : new Date(a.date) - new Date(b.date);
        } else if (sortField === "name") {
          return sortOrder === "desc"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        } else if (sortField === "status") {
          return sortOrder === "desc"
            ? b.note_status.localeCompare(a.note_status)
            : a.note_status.localeCompare(b.note_status);
        }
        return 0;
      });
    }
  
    setFilteredNotes(filtered);
  }, [items, searchQuery, sortField, sortOrder, onlyShow]);
  
  

  const handleNoteDispatch = (id) => {
    const paidAt = new Date().toISOString(); 
    dispatch(notesEdit({ _id: id, note_status: "pagado", paidAt }));
  };

  const handleNoteDeliver = (id) => {
    dispatch(notesEdit({ _id: id, note_status: "entregado" }));
  };

  const handleNoteView = (id) => {
    navigate(`/note/${id}`);
  };

  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    return (
      <Pagination>
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <PageNumber>{currentPage}</PageNumber>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </Pagination>
    );
  };

  return (
    <Container>
      <FiltersContainer>
        <SearchInput
          type="text"
          placeholder="Search by name, amount, or folio"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SortSelect onChange={(e) => setSortField(e.target.value)}>
          <option value="">Sort by</option>
          <option value="date">Date</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </SortSelect>
        <SortOrderSelect onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </SortOrderSelect>
        <ShowSelect onChange={(e) => setOnlyShow(e.target.value)}>
          <option value="">Only show</option>
          <option value="pendiente">Pending</option>
          <option value="pagado">Dispatched</option>
          <option value="entregado">Delivered</option>
          <option value="day">Notes of the day</option>
        </ShowSelect>
      </FiltersContainer>
      <NoteContainer>
        {paginatedNotes.length ? (
          paginatedNotes.map((note) => (
            <NoteBox key={note._id} onClick={() => handleNoteView(note._id)}>
              <NoteInfo>
                <NoteId>Folio: {note.folio}</NoteId>
                <NoteName>Name: {note.name}</NoteName>
                <NoteAmount>Amount: ${note.total}</NoteAmount>
                <NoteStatus>
                  Status:
                  {note.note_status === "pendiente" ? (
                    <Pending>Pending</Pending>
                  ) : note.note_status === "pagado" ? (
                    <Dispatched>Dispatched</Dispatched>
                  ) : note.note_status === "entregado" ? (
                    <Delivered>Delivered</Delivered>
                  ) : (
                    "Error"
                  )}
                </NoteStatus>
                <NoteDate>
                  Date: {moment.utc(note.date).format("MM/DD/YYYY")}
                </NoteDate>
              </NoteInfo>
              <Actions>
                <DispatchBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoteDispatch(note._id);
                  }}
                >
                  Dispatch
                </DispatchBtn>
                <DeliveryBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNoteDeliver(note._id);
                  }}
                >
                  Deliver
                </DeliveryBtn>
              </Actions>
            </NoteBox>
          ))
        ) : (
          <NoNotes>No notes available.</NoNotes>
        )}
      </NoteContainer>
      {renderPagination()}
    </Container>
  );
};

export default NotesSummary;


const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SortSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

const SortOrderSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

const ShowSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

const NoteContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoteBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const NoteInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoteId = styled.p`
  margin: 0 0 0.5rem;
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
`;

const NoteDate = styled.p`
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
`;

const DispatchBtn = styled.button`
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(0, 180, 249);
  }
`;

const DeliveryBtn = styled.button`
  background-color: rgb(102, 108, 255);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(82, 85, 167);
  }
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 3px 5px;
  margin-left: 5px;
`;

const Dispatched = styled.span`
  color: rgb(38, 198, 249);
  background-color: rgba(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  margin-left: 5px;
`;

const Delivered = styled.span`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  margin-left: 5px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin: 0 0.5rem;

  &:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.span`
  padding: 0.5rem 1rem;
`;

const NoNotes = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
`;
