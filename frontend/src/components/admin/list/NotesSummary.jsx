import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { notesFetch, notesEdit } from "../../../features/notesSlice";
import Filters from "./SummaryHelpers/filters";
import Pagination from "./SummaryHelpers/pagination";
import NoteList from "./SummaryHelpers/NoteList";
import ColorPalette from "../../ColorPalette";

const NotesSummary = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items = [], status } = useSelector((state) => state.notes);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOption, setFilterOption] = useState("");
  const [specificDate, setSpecificDate] = useState("");
  const itemsPerPage = 4;

  useEffect(() => {
    if (status !== "success") {
      dispatch(notesFetch());
    }
  }, [dispatch, status]);

  const filteredNotes = useMemo(() => {
    let filtered = items.filter(
      (note) =>
        note.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.total.toString().includes(searchQuery) ||
        note.folio.includes(searchQuery)
    );

    if (filterOption) {
      const today = moment().startOf("day");
      const selectedDate = moment(specificDate).startOf("day");

      filtered = filtered.filter((note) => {
        const noteDate = moment(note.date);
        const notePaidAt = note.paidAt ? moment(note.paidAt) : null;

        if (filterOption === "day") {
          return noteDate.isSame(today, "day");
        } else if (filterOption === "createdOnDate") {
          return specificDate && noteDate.isSame(selectedDate, "day");
        } else if (filterOption === "paidOnDate") {
          return (
            specificDate && notePaidAt && notePaidAt.isSame(selectedDate, "day")
          );
        } else if (filterOption === "createdAndPaidOnDate") {
          return (
            noteDate.isSame(selectedDate, "day") ||
            (notePaidAt && notePaidAt.isSame(selectedDate, "day"))
          );
        } else {
          return note.note_status === filterOption;
        }
      });
    }

    return filtered;
  }, [items, searchQuery, filterOption, specificDate]);

  const sortedNotes = useMemo(() => {
    const notesToSort = [...filteredNotes];
    return notesToSort.sort((a, b) => {
      let aField, bField;

      if (sortField === "date") {
        aField = moment(a.date);
        bField = moment(b.date);
      } else if (sortField === "name") {
        aField = a.name.toLowerCase(); // Convertir a minúsculas para una comparación insensible a mayúsculas
        bField = b.name.toLowerCase();
      } else {
        aField = a[sortField];
        bField = b[sortField];
      }

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
  }, [sortedNotes, currentPage, itemsPerPage]);

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const handleNoteDispatch = (id) => {
    dispatch(
      notesEdit({
        _id: id,
        note_status: "pagado",
        paidAt: moment().toISOString(),
      })
    );
  };

  const handleNoteDeliver = (id) => {
    dispatch(notesEdit({ _id: id, note_status: "entregado" }));
  };

  const handleNoteView = (id) => {
    navigate(`/note/${id}`);
  };

  return (
    <>
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

      <NoteList
        notes={paginatedNotes}
        onView={handleNoteView}
        onDispatch={handleNoteDispatch}
        onDeliver={handleNoteDeliver}
      />

      {sortedNotes.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalNotes={sortedNotes.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* <ColorPalette></ColorPalette> */}
    </>
  );
};

export default NotesSummary;

