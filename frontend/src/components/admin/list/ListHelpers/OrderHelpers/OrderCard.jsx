// OrderCard.js
import React from "react";
import styled from "styled-components";
import moment from "moment";

const OrderCard = ({ order, onView, onDispatch, onDeliver }) => {
  return (
    <CardContainer onClick={onView}>
      <OrderInfo>
        <OrderId>ID: {order._id}</OrderId>
        <OrderName>Name: {order.shipping.name}</OrderName>
        <OrderAmount>Total: ${(order.total / 100)?.toLocaleString()}</OrderAmount>
        <OrderStatus> 
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
        <OrderDate>Date: {moment(order.createdAt).format('YYYY-MM-DD HH:mm')}</OrderDate>
      </OrderInfo>
      <Actions>
        <DispatchButton onClick={(e) => { e.stopPropagation(); onDispatch(order._id); }}>
          Dispatch
        </DispatchButton>
        <DeliveryButton onClick={(e) => { e.stopPropagation(); onDeliver(order._id); }}>
          Deliver
        </DeliveryButton>
      </Actions>
    </CardContainer>
  );
};

export default OrderCard;

// Styled Components
const CardContainer = styled.div`
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
  background-color: white;

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
  margin: 0 0 0.5rem;
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
