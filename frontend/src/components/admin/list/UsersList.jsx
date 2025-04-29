import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { userDelete, usersFetch } from "../../../features/usersSlice";
import UserCard from "./ListHelpers/UserHelpers/UserCard";
import Pagination from "./SummaryHelpers/pagination";
import FilterBar from "./ListHelpers/UserHelpers/filterBar";
import SimpleConfirmationModal from "../../SimpleModal";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";

const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list = [], loading, error } = useSelector((state) => state.users);

  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyShow, setOnlyShow] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    dispatch(usersFetch());
  }, [dispatch]);

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      dispatch(userDelete(userToDelete)).catch((error) => {
        console.error("Error deleting user:", error);
      });
    }
    setShowModal(false);
  };

  const filteredUsers = useMemo(() => {
    return list
      .filter((user) => !user.isGuest) // 🚀 no mostrar usuarios guest
      .filter((user) => {
        const matchesQuery =
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const isNewUser =
          onlyShow === "newUsers"
            ? new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            : true;
        return matchesQuery && isNewUser;
      });
  }, [list, searchQuery, onlyShow]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const order = sortConfig.direction === "ascending" ? 1 : -1;
      if (sortConfig.field === "name") return order * a.name.localeCompare(b.name);
      if (sortConfig.field === "email") return order * a.email.localeCompare(b.email);
      if (sortConfig.field === "isAdmin") return order * (a.isAdmin ? -1 : 1);
      if (sortConfig.field === "createdAt") return order * (new Date(a.createdAt) - new Date(b.createdAt));
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [sortedUsers, currentPage]);

  return (
    <Container>
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        onlyShow={onlyShow}
        setOnlyShow={setOnlyShow}
      />

      {loading && <LoadingSpinner message="Cargando usuarios..." />}
      {error && <ErrorMessage message={error} />}

      {filteredUsers.length === 0 ? (
        <NoUsersMessage>No se encontraron usuarios.</NoUsersMessage>
      ) : (
        <CardsContainer>
          {paginatedUsers.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              onDelete={() => handleDelete(user._id)}
              onView={() => navigate(`/user/${user._id}`)}
            />
          ))}
        </CardsContainer>
      )}

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalNotes={filteredUsers.length}
        itemsPerPage={itemsPerPage}
      />

      <SimpleConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleConfirm={confirmDelete}
        userName={userToDelete ? list.find((u) => u._id === userToDelete)?.name : ""}
      />
    </Container>
  );
};

export default UsersList;

// Styled Components
const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const NoUsersMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #555;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
