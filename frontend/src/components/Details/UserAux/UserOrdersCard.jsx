import styled from "styled-components";
import { Link } from "react-router-dom";
import TimelineView from "./UserProfileTimeline";

const UserOrdersCard = ({ order }) => {
  return (
    <OrderCardContainer>
      <OrderBox>
        <OrderDetails>
          <OrderId>Order #{order._id}</OrderId>
          <OrderCustomer>Name: {order.customer_name}</OrderCustomer>
          <OrderDate>
            Placed on: {new Date(order.createdAt).toLocaleDateString()}
          </OrderDate>
          <OrderTotal>
            Total: {(order.total / 100).toLocaleString("es-MX", {
              style: "currency",
              currency: "MXN",
            })}
          </OrderTotal>
          <OrderStatus>{renderStatus(order.delivery_status)}</OrderStatus>

          <TimelineWrapper>
            <TimelineView order={order} />
          </TimelineWrapper>
        </OrderDetails>

        <Link to={`/order/${order._id}`}>
          <ViewButton>View Order</ViewButton>
        </Link>
      </OrderBox>
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
    case "cancelled":
      return <Cancelled>Cancelled</Cancelled>
    default:
      return <span style={{ color: "red" }}>Unknown</span>;
  }
};

// Styled Components
const OrderCardContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const OrderBox = styled.div`
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: #fff;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    align-items: center;
    text-align: center;
  }
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: flex-start;

  @media (max-width: 768px) {
    align-items: center;
    width: 100%;
  }
`;

const OrderId = styled.p`
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #007bff;
  font-size: 1rem;
`;

const OrderCustomer = styled.p`
  font-size: 1rem;
`;

const OrderDate = styled.p`
  font-weight: lighter;
  font-size: 1rem;
`;

const OrderTotal = styled.p`
  margin: 0.5rem 0;
  font-size: 1.1rem;
`;

const OrderStatus = styled.span`
  display: flex;
  align-items: center;
  font-weight: bold;
`;

const TimelineWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;

  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

const ViewButton = styled.button`
  background: #007bff;
  color: white;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: scale(1.03);
  }

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 1rem;
  }
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
`;

const Dispatched = styled.span`
  color: rgb(0, 123, 255);
  background: rgba(0, 123, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
`;

const Delivered = styled.span`
  color: rgb(40, 167, 69);
  background: rgba(40, 167, 69, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
`;
const Cancelled = styled.span`
  color: rgb(220, 53, 69); 
  background: rgba(220, 53, 69, 0.12); 
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
`;


export default UserOrdersCard;
