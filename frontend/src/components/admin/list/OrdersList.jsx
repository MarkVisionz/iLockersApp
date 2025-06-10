import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import {
  ordersFetch,
  ordersEdit,
  resetError,
} from "../../../features/ordersSlice";
import FilterBar from "./ListHelpers/OrderHelpers/FilterBar";
import OrderCard from "./ListHelpers/OrderHelpers/OrderCard";
import Pagination from "./SummaryHelpers/pagination";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";

const OrdersList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    list = [],
    status,
    error,
  } = useSelector((state) => state.orders);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [onlyShow, setOnlyShow] = useState("");
  const itemsPerPage = 4;

  // Fetch orders if status is idle or failed
  useEffect(() => {
    if (status === "idle" || status === "failed") {
      dispatch(ordersFetch());
    }
  }, [dispatch, status]);

  // Debug duplicate orders
  useEffect(() => {
    const ids = list.map((order) => order._id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) {
      console.warn("Duplicate order IDs detected:", duplicates);
    }
  }, [list]);

  // Filter and sort orders
  useEffect(() => {
    if (status !== "succeeded") return;
  
    let filtered = [...list];
  
    if (searchQuery.trim()) {
      filtered = filtered.filter((order) => {
        const name =
          order?.contact?.name ||
          order?.shipping?.name ||
          order?.customer_name ||
          "";
        const total = order?.total?.toString() || "";
        const id = order?._id || "";
  
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          total.includes(searchQuery) ||
          id.includes(searchQuery)
        );
      });
    }
  
    if (onlyShow) {
      if (onlyShow === "day") {
        filtered = filtered.filter((order) =>
          moment(order?.createdAt).isSame(moment(), "day")
        );
      } else {
        filtered = filtered.filter(
          (order) => order?.delivery_status === onlyShow
        );
      }
    }
  
    if (sortField.field) {
      filtered = filtered.sort((a, b) => {
        const isAscending = sortField.direction === "ascending" ? 1 : -1;
  
        if (sortField.field === "date") {
          return (
            (new Date(a?.createdAt) - new Date(b?.createdAt)) * isAscending
          );
        } else if (sortField.field === "name") {
          const nameA =
            a?.contact?.name || a?.shipping?.name || a?.customer_name || "";
          const nameB =
            b?.contact?.name || b?.shipping?.name || b?.customer_name || "";
          return nameA.localeCompare(nameB) * isAscending;
        } else if (sortField.field === "status") {
          return (
            (a?.delivery_status || "").localeCompare(b?.delivery_status || "") *
            isAscending
          );
        }
  
        return 0;
      });
    }
  
    setFilteredOrders(filtered);
  }, [list, searchQuery, sortField, onlyShow, status]);

  const handleOrderDispatch = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "dispatched" }));
  };

  const handleOrderDeliver = (id) => {
    dispatch(ordersEdit({ id, delivery_status: "delivered" }));
  };

  const handleOrderView = (id) => {
    navigate(`/order/${id}`);
  };

  const handleOrderDelete = (id) => {
    if (window.confirm("¿Estás seguro de cancelar esta orden?")) {
      dispatch(ordersEdit({ id, delivery_status: "cancelled" }));
    }
  };

  const handleRetry = () => {
    dispatch(resetError());
    dispatch(ordersFetch());
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (status === "loading" && !list.length) {
    return <LoadingSpinner />;
  }

  if (status === "failed" && error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={handleRetry}>Retry</RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortField={sortField}
        setSortField={setSortField}
        onlyShow={onlyShow}
        setOnlyShow={setOnlyShow}
      />

      <OrderContainer>
        {paginatedOrders.length ? (
          paginatedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onView={() => handleOrderView(order._id)}
              onDispatch={handleOrderDispatch}
              onDeliver={handleOrderDeliver}
              onDelete={handleOrderDelete}
            />
          ))
        ) : (
          <NoOrders>No orders available.</NoOrders>
        )}
      </OrderContainer>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalNotes={filteredOrders.length}
        itemsPerPage={itemsPerPage}
      />
    </Container>
  );
};

export default OrdersList;

const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const OrderContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoOrders = styled.p`
  margin: 0;
  text-align: center;
  font-style: italic;
  color: #888;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;