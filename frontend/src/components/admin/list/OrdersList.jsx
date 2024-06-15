import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { ordersFetch, ordersEdit } from "../../../features/ordersSlice";

const OrdersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list } = useSelector((state) => state.orders);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [onlyShow, setOnlyShow] = useState('');
  const itemsPerPage = 4;

  useEffect(() => {
    dispatch(ordersFetch());
  }, [dispatch]);

  useEffect(() => {
    let filtered = list.filter(order => 
      order.shipping.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.total.toString().includes(searchQuery) ||
      order._id.includes(searchQuery)
    );

    if (onlyShow) {
      if (onlyShow === 'day') {
        filtered = filtered.filter(order => moment(order.createdAt).isSame(moment(), 'day'));
      } else {
        filtered = filtered.filter(order => order.delivery_status === onlyShow);
      }
    }

    if (sortField === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortField === 'name') {
      filtered = filtered.sort((a, b) => a.shipping.name.localeCompare(b.shipping.name));
    } else if (sortField === 'status') {
      filtered = filtered.sort((a, b) => a.delivery_status.localeCompare(b.delivery_status));
    }

    setFilteredOrders(filtered);
  }, [list, searchQuery, sortField, onlyShow]);

  const handleOrderDispatch = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "dispatched" }));
  };

  const handleOrderDeliver = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "delivered" }));
  };

  const handleOrderView = (id) => {
    navigate(`/order/${id}`);
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

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
          placeholder="Search by name, amount, or ID" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <SortSelect onChange={(e) => setSortField(e.target.value)}>
          <option value="">Sort by</option>
          <option value="date">Date</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </SortSelect>
        <ShowSelect onChange={(e) => setOnlyShow(e.target.value)}>
          <option value="">Only show</option>
          <option value="pending">Pending</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="day">Orders of the day</option>
        </ShowSelect>
      </FiltersContainer>
      <OrderContainer>
        {paginatedOrders.length ? (
          paginatedOrders.map((order) => (
            <OrderBox key={order._id} onClick={() => handleOrderView(order._id)}>
              <OrderInfo>
                <OrderId>ID: {order._id}</OrderId>
                <OrderName>Name: {order.shipping.name}</OrderName>
                <OrderAmount>Amount: ${(order.total / 100)?.toLocaleString()}</OrderAmount>
                <OrderStatus>
                  Status: 
                  {order.delivery_status === "pending" ? (
                    <Pending>Pending</Pending>
                  ) : order.delivery_status === "dispatched" ? (
                    <Dispatched>Dispatched</Dispatched>
                  ) : order.delivery_status === "delivered" ? (
                    <Delivered>Delivered</Delivered>
                  ) : (
                    "Error"
                  )}
                </OrderStatus>
                <OrderDate>Date: {moment(order.createdAt).format('MM/DD/YYYY')}</OrderDate>
              </OrderInfo>
              <Actions>
                <DispatchBtn onClick={(e) => { e.stopPropagation(); handleOrderDispatch(order._id); }}>
                  Dispatch
                </DispatchBtn>
                <DeliveryBtn onClick={(e) => { e.stopPropagation(); handleOrderDeliver(order._id); }}>
                  Deliver
                </DeliveryBtn>
              </Actions>
            </OrderBox>
          ))
        ) : (
          <NoOrders>No orders available.</NoOrders>
        )}
      </OrderContainer>
      {renderPagination()}
    </Container>
  );
};

export default OrdersList;

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

const ShowSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

const OrderContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const OrderBox = styled.div`
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

const OrderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const OrderId = styled.p`
  margin: 0 0 0.5rem;
`;

const OrderName = styled.p`
  margin: 0 0 0.5rem;
`;

const OrderAmount = styled.p`
  margin: 0 0 0.5rem;
`;

const OrderStatus = styled.p`
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
`;

const OrderDate = styled.p`
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
`;

const DeliveryBtn = styled.button`
  background-color: rgb(102, 108, 255);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
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

const NoOrders = styled.p`
  margin: 0;
  text-align: center;
  font-style: italic;
  color: #888;
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
`;
