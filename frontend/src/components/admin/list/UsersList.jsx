import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { userDelete, usersFetch } from "../../../features/usersSlice";

const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.users);
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewUsers, setShowNewUsers] = useState(false);
  const [onlyShow, setOnlyShow] = useState("");
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(usersFetch());
  }, [dispatch]);

  const handleDelete = (id) => {
    try {
      dispatch(userDelete(id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleSortChange = (e) => {
    const field = e.target.value;
    setSortConfig({
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    });
  };

  const handleToggleNewUsers = () => {
    setShowNewUsers(!showNewUsers);
  };

  const handleOnlyShowChange = (e) => {
    setOnlyShow(e.target.value);
  };

  const filteredUsers = list.filter((user) => {
    if (onlyShow === "newUsers") {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(user.createdAt) > oneWeekAgo;
    }
    return true;
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    if (sortConfig.field === "name") {
      return sortConfig.direction === "ascending"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortConfig.field === "email") {
      return sortConfig.direction === "ascending"
        ? a.email.localeCompare(b.email)
        : b.email.localeCompare(a.email);
    } else if (sortConfig.field === "isAdmin") {
      return sortConfig.direction === "ascending"
        ? a.isAdmin
          ? -1
          : 1
        : b.isAdmin
        ? -1
        : 1;
    } else if (sortConfig.field === "createdAt") {
      return sortConfig.direction === "ascending"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Container>
      <TopBar>
        <SearchInput
          type="text"
          placeholder="Search by name, email, or role"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SortSelect value={sortConfig.field} onChange={handleSortChange}>
          <option value="">Sort by</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="isAdmin">Role</option>
          <option value="createdAt">Antigüedad</option>
        </SortSelect>
        <ShowSelect value={onlyShow} onChange={handleOnlyShowChange}>
          <option value="">Only show</option>
          <option value="newUsers">New Users</option>
        </ShowSelect>
      </TopBar>
      <CardsContainer>
        {paginatedUsers.map((user) => (
          <Card key={user._id}>
            <CardInfo>
              <UserId>ID: {user._id}</UserId>
              <UserName>Name: {user.name}</UserName>
              <UserEmail>Email: {user.email}</UserEmail>
              <UserRole>
                {user.isAdmin ? (
                  <Admin>Admin</Admin>
                ) : (
                  <Customer>Customer</Customer>
                )}
              </UserRole>
            </CardInfo>
            <CardActions>
              <DeleteButton onClick={() => handleDelete(user._id)}>
                Delete
              </DeleteButton>
              <ViewButton onClick={() => navigate(`/user/${user._id}`)}>
                View
              </ViewButton>
            </CardActions>
          </Card>
        ))}
      </CardsContainer>
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
          disabled={
            currentPage === Math.ceil(filteredUsers.length / itemsPerPage)
          }
        >
          Next
        </Button>
      </Pagination>
    </Container>
  );
};

export default UsersList;

const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const ShowSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const UserId = styled.div`
  font-weight: bold;
`;

const UserName = styled.div``;

const UserEmail = styled.div``;

const UserRole = styled.div``;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DeleteButton = styled.button`
  background-color: rgb(255, 77, 73);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: rgb(230, 70, 65);
  }
`;

const ViewButton = styled.button`
  background-color: rgb(114, 225, 40);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: rgb(100, 200, 30);
  }
`;

const Admin = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
`;

const Customer = styled.span`
  color: rgb(38, 198, 249);
  background-color: rgba(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.span`
  margin: 0 0.5rem;
`;
