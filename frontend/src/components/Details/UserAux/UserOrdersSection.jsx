import React from "react";
import styled from "styled-components";
import UserOrdersCard from "./UserOrdersCard";
import UserPagination from "./UserPagination";

const UserOrdersSection = ({
  orders,
  userId,
  authEmail,
  type,
  currentPage,
  sortOrder,
  onPageChange,
  onSortChange,
}) => {
  const ITEMS_PER_PAGE = 3;

  const filteredOrders = React.useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    const profileOrders = orders.filter(
      (order) =>
        order?.userId?.toString() === userId ||
        (order?.contact?.email === authEmail && order?.isGuestOrder)
    );

    if (type === "pending") {
      return profileOrders.filter((order) =>
        ["pending", "dispatched"].includes(order?.delivery_status)
      );
    } else {
      return profileOrders
        .filter((order) => order?.delivery_status === "delivered")
        .sort((a, b) =>
          sortOrder === "asc"
            ? new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)
            : new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
        );
    }
  }, [orders, userId, authEmail, type, sortOrder]);

  const currentOrders = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "pending" ? "Órdenes en Proceso" : "Órdenes Completadas"}
        </CardTitle>
        {type === "completed" && (
          <SortButton onClick={onSortChange}>
            {sortOrder === "asc" ? "Más Antiguas" : "Más Recientes"}
          </SortButton>
        )}
      </CardHeader>

      {filteredOrders.length === 0 ? (
        <EmptyState>
          {type === "pending"
            ? "No hay órdenes pendientes o despachadas."
            : "No se encontraron órdenes completadas."}
        </EmptyState>
      ) : (
        <>
          {currentOrders.map((order) => (
            <UserOrdersCard
              key={`${order?._id}-${order?.delivery_status}`}
              order={order}
            />
          ))}
          <UserPagination
            currentPage={currentPage}
            setCurrentPage={onPageChange}
            totalNotes={filteredOrders.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </Card>
  );
};

export default UserOrdersSection;


// Estilos (iguales a los del original)
const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 1rem;
  text-align: center;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
  }
`;

const SortButton = styled(ActionButton)`
  padding: 0.5rem 1rem;
  background: #e5e5ea;
  color: #1d1d1f;
  font-size: 0.85rem;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
`;



