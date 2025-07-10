import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  notesFetch,
  notesEdit,
  notesDelete,
} from "../../../features/notesSlice";
import Filters from "./SummaryHelpers/filters";
import Pagination from "./SummaryHelpers/pagination";
import NoteList from "./SummaryHelpers/NoteList";
import { toast } from "react-toastify";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";

const NotesSummary = ({ businessId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], status, error } = useSelector((state) => state.notes);
  const { businesses } = useSelector((state) => state.auth);

  const isValidBusiness = businesses.some((b) => b._id === businessId);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOption, setFilterOption] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  const itemsPerPage = 4;

  useEffect(() => {
    console.log("NotesSummary useEffect - Debug:", {
      businessId,
      businesses: businesses.map((b) => b._id),
      isValidBusiness,
    });

    if (!isValidBusiness || !businessId) {
      console.warn(`Invalid businessId: ${businessId}`);
      return;
    }

    if (status === "idle" || status === "rejected") {
      console.log(`Dispatching notesFetch for businessId: ${businessId}`);
      dispatch(notesFetch({ businessId }));
    }
  }, [dispatch, status, businessId, isValidBusiness]);

  const businessNotes = useMemo(() => {
    const notes = items.filter((note) => note.businessId === businessId);
    console.log(`Filtered ${notes.length} notes for businessId: ${businessId}`);
    return notes;
  }, [items, businessId]);

  const filteredNotes = useMemo(() => {
    let filtered = businessNotes.filter((note) =>
      [
        note.name?.toLowerCase() || "",
        note.total?.toString() || "",
        note.folio || "",
      ].some((field) => field.includes(searchQuery.toLowerCase()))
    );

    if (filterOption) {
      const today = moment().startOf("day");
      const selectedDate = moment(specificDate).startOf("day");

      filtered = filtered.filter((note) => {
        const noteDate = moment(note.createdAt);
        const notePaidAt = note.paidAt ? moment(note.paidAt) : null;

        switch (filterOption) {
          case "day":
            return noteDate.isSame(today, "day");
          case "createdOnDate":
            return specificDate && noteDate.isSame(selectedDate, "day");
          case "paidOnDate":
            return specificDate && notePaidAt?.isSame(selectedDate, "day");
          case "createdAndPaidOnDate":
            return (
              specificDate &&
              (noteDate.isSame(selectedDate, "day") ||
                notePaidAt?.isSame(selectedDate, "day"))
            );
          default:
            return note.note_status === filterOption;
        }
      });
    }

    return filtered;
  }, [businessNotes, searchQuery, filterOption, specificDate]);

  const sortedNotes = useMemo(() => {
    if (!sortField) return filteredNotes;
    return [...filteredNotes].sort((a, b) => {
      let aField =
        sortField === "createdAt" ? moment(a.createdAt) : a[sortField];
      let bField =
        sortField === "createdAt" ? moment(b.createdAt) : b[sortField];

      if (sortField === "name") {
        aField = aField?.toLowerCase() || "";
        bField = bField?.toLowerCase() || "";
      }

      if (!aField && !bField) return 0;
      if (!aField) return 1;
      if (!bField) return -1;

      return sortOrder === "desc"
        ? aField < bField
          ? 1
          : -1
        : aField > bField
        ? 1
        : -1;
    });
  }, [filteredNotes, sortField, sortOrder]);

  const paginatedNotes = useMemo(() => {
    return sortedNotes.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedNotes, currentPage]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleNoteDispatch = (id) => {
    dispatch(
      notesEdit({
        _id: id,
        note_status: "pagado",
        paidAt: moment().toISOString(),
        businessId,
      })
    ).then((result) => {
      if (notesEdit.fulfilled.match(result)) {
        toast.success("Nota marcada como pagada");
      } else {
        toast.error(result.payload || "Error al marcar como pagada");
      }
    });
  };

  const handleNoteDeliver = (id) => {
    dispatch(
      notesEdit({
        _id: id,
        note_status: "entregado",
        businessId,
      })
    ).then((result) => {
      if (notesEdit.fulfilled.match(result)) {
        toast.success("Nota marcada como entregada");
      } else {
        toast.error(result.payload || "Error al marcar como entregada");
      }
    });
  };

  const handleNoteView = (id, businessId) => {
    navigate(`/note/${id}/${businessId}`);
  };

  const handleDelete = (id) => {
    dispatch(notesDelete({ id, businessId })).then((result) => {
      if (notesDelete.fulfilled.match(result)) {
        toast.success("Nota eliminada");
      } else {
        toast.error(result.payload || "Error al eliminar nota");
      }
    });
  };

  if (!businessId) {
    return (
      <ErrorContainer>
        <ErrorMessage>No se proporcionó un ID de negocio válido</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (!isValidBusiness) {
    return (
      <ErrorContainer>
        <ErrorMessage>Negocio no encontrado o no autorizado</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (status === "pending" && !businessNotes.length) {
    return <LoadingSpinner message="Cargando notas..." />;
  }

  if (status === "rejected") {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Error al cargar notas: {error || "Por favor intenta de nuevo"}
        </ErrorMessage>
      </ErrorContainer>
    );
  }

  return (
    <StyledNotesSummary>
      <Filters
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        specificDate={specificDate}
        setSpecificDate={setSpecificDate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {paginatedNotes.length === 0 ? (
        <NoDataMessage>
          <p>Tu negocio está listo, pero aún no tienes notas registradas.</p>
          <CreateNoteButton
            onClick={() => navigate("/laundry-note", { state: { businessId } })}
          >
            Crear tu primera nota
          </CreateNoteButton>
        </NoDataMessage>
      ) : (
        <NoteList
          notes={paginatedNotes}
          businessId={businessId}
          onView={handleNoteView}
          onDispatch={handleNoteDispatch}
          onDeliver={handleNoteDeliver}
          onDelete={handleDelete}
        />
      )}

      {sortedNotes.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalNotes={sortedNotes.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </StyledNotesSummary>
  );
};

const StyledNotesSummary = styled.div`
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const NoDataMessage = styled.p`
  text-align: center;
  color: #666;
  margin: 2rem 0;
`;

const CreateNoteButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

export default NotesSummary;
