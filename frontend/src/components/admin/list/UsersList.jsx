import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { userDelete, usersFetch } from "../../../features/usersSlice";
import UserCard from "./ListHelpers/UserHelpers/UserCard"; // Asegúrate de que este componente exista
import Pagination from "./SummaryHelpers/pagination"; // Importa el componente de paginación
import FilterBar from "./ListHelpers/UserHelpers/filterBar"; // Importa el nuevo componente de filtro
import SimpleConfirmationModal from "../../SimpleModal"; // Importa el nuevo modal
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";

const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list = [], loading, error } = useSelector((state) => state.users); // Asegúrate de que list sea un array por defecto

  const [sortConfig, setSortConfig] = useState({
    field: "",
    direction: "ascending",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyShow, setOnlyShow] = useState("");
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    dispatch(usersFetch());
  }, [dispatch]);

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowModal(true); // Mostrar el modal de confirmación
  };

  const confirmDelete = () => {
    if (userToDelete) {
      dispatch(userDelete(userToDelete)).catch((error) => {
        console.error("Error deleting user:", error);
        // Aquí podrías mostrar un mensaje de error en la interfaz
      });
    }
    setShowModal(false); // Cerrar el modal
  };

  const filteredUsers = useMemo(() => {
    return list.filter((user) => {
      const matchesQuery =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const isNewUser  =
        onlyShow === "newUsers"
          ? new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : true;
      return matchesQuery && isNewUser ;
    });
  }, [list, searchQuery, onlyShow]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const order = sortConfig.direction === "ascending" ? 1 : -1;
      if (sortConfig.field === "name")
        return order * a.name.localeCompare(b.name);
      if (sortConfig.field === "email")
        return order * a.email.localeCompare(b.email);
      if (sortConfig.field === "isAdmin") return order * (a.isAdmin ? -1 : 1);
      if (sortConfig.field === "createdAt")
        return order * (new Date(a.createdAt) - new Date(b.createdAt));
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
      {loading && (
        <LoadingSpinner message={`Loading users ...`} />
      )}
      {error && <ErrorMessage message={error} />}
      {list.length === 0 ? (
        <NoUsersMessage>No users found.</NoUsersMessage>
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
        userName={
          userToDelete
            ? list.find((user) => user._id === userToDelete)?.name
            : ""
        }
      />
    </Container>
  );
};

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

export default UsersList;