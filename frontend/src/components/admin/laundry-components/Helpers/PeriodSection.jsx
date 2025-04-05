// Helpers/PeriodSection.js
import React from "react";
import styled from "styled-components";

const PeriodSection = ({ title, createdNotes, totalSales, cashInHand, color }) => (
  <PeriodContainer color={color}>
    <Subtitle>{title}</Subtitle>
    <Info>
      <InfoTitle>Notas Creadas</InfoTitle>
      <InfoData>{createdNotes.length}</InfoData>
    </Info>
    <Info>
      <InfoTitle>Total Ventas</InfoTitle>
      <InfoData>{totalSales.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</InfoData>
    </Info>
    <Info>
      <InfoTitle>Cash In Hand</InfoTitle>
      <InfoData>{cashInHand.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</InfoData>
    </Info>
  </PeriodContainer>
);

export default PeriodSection;

// Styled Components para PeriodSection
const PeriodContainer = styled.div`
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