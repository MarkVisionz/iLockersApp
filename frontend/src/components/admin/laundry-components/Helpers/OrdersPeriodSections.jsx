// components/Helpers/OrderPeriodSection.js
import styled from "styled-components";

const OrderPeriodSection = ({ title, orders, totalSales, color }) => {
  // Excluimos canceladas
  const validOrders = orders.filter(order => order.status !== "cancelled");

  return (
    <SectionWrapper color={color}>
      <Subtitle>{title}</Subtitle>
      <Info>
        <InfoTitle>Órdenes Recibidas</InfoTitle>
        <InfoData>{validOrders.length} orden{validOrders.length === 1 ? "" : "es"}</InfoData>
      </Info>
      <Info>
        <InfoTitle>Total Ventas</InfoTitle>
        <InfoData>
          {Number(
            validOrders.reduce((sum, order) => sum + (order.total || 0), 0)
          ).toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
          })}
        </InfoData>
      </Info>
    </SectionWrapper>
  );
};

export default OrderPeriodSection;

const SectionWrapper = styled.div`
  background-color: ${(props) => props.color || "#4b70e2"};
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  flex: 1;
  color: #fff;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
`;

const Subtitle = styled.h4`
  margin-bottom: 1rem;
  color: #eaeaff;
  border-bottom: 2px solid #fff;
  padding-bottom: 0.5rem;
`;

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
`;

const InfoTitle = styled.p`
  flex: 1;
  color: #eaeaff;
`;

const InfoData = styled.p`
  flex: 1;
  text-align: right;
  font-weight: bold;
  margin-left: 1.5rem;
  color: #eaeaff;
`;
