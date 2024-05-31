import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { userDelete, usersFetch } from "../../../features/usersSlice";

const UsersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.users);
  const [sortConfig, setSortConfig] = useState({ key: 'uName', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    dispatch(usersFetch());
  }, [dispatch]);

  useEffect(() => {
    setFilteredUsers(list.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.isAdmin ? "admin" : "customer").includes(searchQuery.toLowerCase())
    ));
  }, [list, searchQuery]);

  const handleDelete = (id) => {
    try {
      dispatch(userDelete(id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <Container>
      <SearchContainer>
        <SearchInput 
          type="text" 
          placeholder="Search by name, email, or role" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </SearchContainer>
      <Table>
        <thead>
          <tr>
            <Th onClick={() => handleSort('id')}>ID {getSortArrow('id')}</Th>
            <Th onClick={() => handleSort('name')}>Name {getSortArrow('name')}</Th>
            <Th onClick={() => handleSort('email')}>Email {getSortArrow('email')}</Th>
            <Th onClick={() => handleSort('isAdmin')}>Role {getSortArrow('isAdmin')}</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user) => (
            <Tr key={user._id}>
              <Td>{user._id}</Td>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>
                {user.isAdmin ? <Admin>Admin</Admin> : <Customer>Customer</Customer>}
              </Td>
              <Td>
                <Actions>
                  <Delete onClick={() => handleDelete(user._id)}>Delete</Delete>
                  <View onClick={() => navigate(`/user/${user._id}`)}>View</View>
                </Actions>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination>
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <PageNumber>{currentPage}</PageNumber>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
          disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
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

const SearchContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background-color: #f8f8f8;
  color: #333;
  padding: 1rem;
  cursor: pointer;
  text-align: left;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

const Td = styled.td`
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 10px;
`;

const Delete = styled.button`
  background-color: rgb(255, 77, 73);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(230, 70, 65);
  }
`;

const View = styled.button`
  background-color: rgb(114, 225, 40);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(100, 200, 30);
  }
`;

const Admin = styled.button`
  color: rgb(253, 181, 40);
  background: rgb(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  border: none;
  outline: none;
`;

const Customer = styled.button`
  color: rgb(38, 198, 249);
  background-color: rgb(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  border: none;
  outline: none;
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
  border-radius: 3px;
  cursor: pointer;

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;

const PageNumber = styled.span`
  margin: 0 1rem;
  font-size: 1.2rem;
  font-weight: bold;
`;
