import React from "react";
import styled from "styled-components";
import moment from "moment";

const OrderCard = ({ order, onView, onDispatch, onDeliver, onDelete }) => {
  const name = order?.contact?.name || "Sin nombre";
  const total = order?.total !== undefined
    ? order.total.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      })
    : "N/A";
  const date = order?.createdAt
    ? moment(order.createdAt).format("YYYY-MM-DD HH:mm")
    : "Fecha no disponible";

  const isCancelled = order.delivery_status === "cancelled";

  return (
    <CardContainer onClick={onView} $cancelled={isCancelled}>
  <BadgeContainer>
    {order.isGuestOrder ? (
      <BadgeGuest>Guest</BadgeGuest>
    ) : (
      <BadgeUser>User</BadgeUser>
    )}
  </BadgeContainer>
  <OrderInfo>
    <OrderId>ID: {order._id}</OrderId>
    <OrderName>Nombre: {name}</OrderName>
    <OrderAmount>Total: {total}</OrderAmount>
    <OrderStatus>
      {order.delivery_status === "pending" ? (
        <Pending>Pendiente</Pending>
      ) : order.delivery_status === "dispatched" ? (
        <Dispatched>En camino</Dispatched>
      ) : order.delivery_status === "delivered" ? (
        <Delivered>Entregado</Delivered>
      ) : order.delivery_status === "cancelled" ? (
        <Cancelled>Cancelado</Cancelled>
      ) : (
        "Sin estado"
      )}
    </OrderStatus>
    <OrderDate>Fecha: {date}</OrderDate>
  </OrderInfo>
  <Actions>
    <DispatchButton onClick={(e) => { e.stopPropagation(); onDispatch(order._id); }}>
      Dispatch
    </DispatchButton>
    <DeliveryButton onClick={(e) => { e.stopPropagation(); onDeliver(order._id); }}>
      Deliver
    </DeliveryButton>
    <DeleteButton onClick={(e) => { e.stopPropagation(); onDelete(order._id); }}>
      Cancelar
    </DeleteButton>
  </Actions>
</CardContainer>

  );
};

export default OrderCard;


const BadgeContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

const BadgeGuest = styled.span`
  background-color: #ffc107;
  color: #333;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

const BadgeUser = styled.span`
  background-color: #28a745;
  color: #fff;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

// Styled Components
const CardContainer = styled.div`
  position: relative; /* 🔥 importante para que el BadgeContainer se ubique sobre la Card */
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: ${({ $cancelled }) => ($cancelled ? "#f8d7da" : "white")};
  opacity: ${({ $cancelled }) => ($cancelled ? 0.6 : 1)};
  pointer-events: ${({ $cancelled }) => ($cancelled ? "none" : "auto")};

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const OrderInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const OrderId = styled.p`
  margin: 0.5rem 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const OrderName = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
`;

const OrderAmount = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
`;

const OrderStatus = styled.p`
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  font-weight: bold;
`;

const OrderDate = styled.p`
  margin: 0;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 1rem;
    flex-direction: row;
  }
`;

const DispatchButton = styled.button`
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const DeliveryButton = styled.button`
  background-color: rgb(102, 108, 255);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(85, 85, 255);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const DeleteButton = styled.button`
  background-color: rgb(255, 77, 77);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(230, 50, 50);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const Pending = styled.span`
  color: rgb(255, 165, 0);
  background: rgba(255, 165, 0, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Dispatched = styled.span`
  color: rgb(0, 123, 255);
  background: rgba(0, 123, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Delivered = styled.span`
  color: rgb(40, 167, 69);
  background: rgba(40, 167, 69, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Cancelled = styled.span`
  color: rgb(153, 0, 0);
  background: rgba(153, 0, 0, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;
