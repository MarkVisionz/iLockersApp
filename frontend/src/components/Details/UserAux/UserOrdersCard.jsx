// UserOrdersCard.js
import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const UserOrdersCard = ({ order }) => {

  const navigate = useNavigate();

  const handleNoteView = (id) => {
    navigate(`/order/${order._id}`);
  };

  return (
    <OrderCardContainer>
       <NoteBox key={order._id} onClick={() => handleNoteView(order._id)}>
        <OrderDetails>
          <NoteId>Order #{order._id}</NoteId>
          <NoteStatus>{renderStatus(order.delivery_status)}</NoteStatus>
          <NoteDate>Placed on: {new Date(order.createdAt).toLocaleDateString()}</NoteDate>
          <NoteAmount>Total: ${order.total/100}</NoteAmount>
        </OrderDetails>
        <Link to={`/order/${order._id}`}>
        <ViewButton>View Order</ViewButton>
      </Link>
        </NoteBox>

     
    </OrderCardContainer>
  );
};

const renderStatus = (status) => {
  switch (status) {
    case "pending":
      return <Pending>Pending</Pending>;
    case "dispatched":
      return <Dispatched>Dispatched</Dispatched>;
    case "delivered":
      return <Delivered>Delivered</Delivered>;
    default:
      return "Error";
  }
};

const NoteStatus = styled.span`
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  font-weight: bold;
`;

const NoteBox = styled.div`
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

const OrderCardContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const NoteId = styled.p`
   margin: 0 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const NoteAmount = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
`;

const NoteDate = styled.p`
  margin: 0;
  font-weight: lighter;
  font-size: 1rem;
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
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

const ViewButton = styled.button`
  background: #007bff;
  color: white;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

export default UserOrdersCard;
