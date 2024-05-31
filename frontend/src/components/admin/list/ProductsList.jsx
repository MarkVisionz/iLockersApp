import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { productDelete } from "../../../features/productsSlice";
import EditProduct from "../EditProduct";

const ProductsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.products);
  const [sortConfig, setSortConfig] = useState({ key: 'pName', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setFilteredItems(items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.price.toString().includes(searchQuery) ||
      item._id.includes(searchQuery)
    ));
  }, [items, searchQuery]);

  const handleDelete = (id) => {
    dispatch(productDelete(id));
    console.log("Deleting");
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const paginatedItems = sortedItems.slice(
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
          placeholder="Search by name, price, or ID" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </SearchContainer>
      <Table>
        <thead>
          <tr>
            <Th onClick={() => handleSort('id')}>ID {getSortArrow('id')}</Th>
            <Th>Image</Th>
            <Th onClick={() => handleSort('name')}>Name {getSortArrow('name')}</Th>
            <Th onClick={() => handleSort('weight')}>Weight(g) {getSortArrow('weight')}</Th>
            <Th onClick={() => handleSort('price')}>Price {getSortArrow('price')}</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item) => (
            <Tr key={item._id}>
              <Td>{item._id}</Td>
              <Td>
                <ImageContainer>
                  <img src={item.image.url} alt="" />
                </ImageContainer>
              </Td>
              <Td>{item.name}</Td>
              <Td>{item.weight}</Td>
              <Td>{item.price.toLocaleString()}</Td>
              <Td>
                <Actions>
                  <Delete onClick={() => handleDelete(item._id)}>Delete</Delete>
                  <EditProduct prodId={item._id} />
                  <View onClick={() => navigate(`/product/${item._id}`)}>View</View>
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
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredItems.length / itemsPerPage)))}
          disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
        >
          Next
        </Button>
      </Pagination>
    </Container>
  );
};

export default ProductsList;

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

const ImageContainer = styled.div`
  img {
    height: 40px;
  }
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
    background-color: rgb(200, 50, 50);
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
