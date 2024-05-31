import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { ordersEdit, ordersFetch } from "../../../features/ordersSlice";
import moment from "moment";

const OrdersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    dispatch(ordersFetch());
  }, [dispatch]);

  useEffect(() => {
    setFilteredOrders(list.filter(order => 
      order.shipping.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.total.toString().includes(searchQuery) ||
      order._id.includes(searchQuery)
    ));
  }, [list, searchQuery]);

  const handleOrderDispatch = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "dispatched" }));
  };

  const handleOrderDeliver = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "delivered" }));
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const paginatedOrders = sortedOrders.slice(
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
          placeholder="Search by name, amount, or ID" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </SearchContainer>
      <Table>
        <thead>
          <tr>
            <Th onClick={() => handleSort('id')}>ID {getSortArrow('id')}</Th>
            <Th onClick={() => handleSort('shipping.name')}>Name {getSortArrow('shipping.name')}</Th>
            <Th onClick={() => handleSort('total')}>Amount($) {getSortArrow('total')}</Th>
            <Th onClick={() => handleSort('delivery_status')}>Status {getSortArrow('delivery_status')}</Th>
            <Th onClick={() => handleSort('createdAt')}>Date {getSortArrow('createdAt')}</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => (
            <Tr key={order._id}>
              <Td>{order._id}</Td>
              <Td>{order.shipping.name}</Td>
              <Td>{(order.total / 100)?.toLocaleString()}</Td>
              <Td>
                {order.delivery_status === "pending" ? (
                  <Pending>Pending</Pending>
                ) : order.delivery_status === "dispatched" ? (
                  <Dispatched>Dispatched</Dispatched>
                ) : order.delivery_status === "delivered" ? (
                  <Delivered>Delivered</Delivered>
                ) : (
                  "Error"
                )}
              </Td>
              <Td>{moment(order.createdAt).format('MM/DD/YYYY')}</Td>
              <Td>
                <Actions>
                  <DispatchBtn onClick={() => handleOrderDispatch(order._id)}>
                    Dispatch
                  </DispatchBtn>
                  <DeliveryBtn onClick={() => handleOrderDeliver(order._id)}>
                    Deliver
                  </DeliveryBtn>
                  <View onClick={() => navigate(`/order/${order._id}`)}>
                    View
                  </View>
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
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredOrders.length / itemsPerPage)))}
          disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
        >
          Next
        </Button>
      </Pagination>
    </Container>
  );
};

export default OrdersList;

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

const DispatchBtn = styled.button`
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(30, 150, 200);
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
    background-color: rgb(80, 85, 230);
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

const Pending = styled.button`
  color: rgb(253, 181, 40);
  background: rgb(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  border: none;
  outline: none;
`;

const Dispatched = styled.button`
  color: rgb(38, 198, 249);
  background-color: rgb(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  border: none;
  outline: none;
`;

const Delivered = styled.button`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
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
