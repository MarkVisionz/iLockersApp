import React from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceButton = ({ service, quantity, onIncrease, onDecrease }) => (
  <ServiceContainer>
    <ServiceName>{service}</ServiceName>
    <QuantityControl>
      <IconButton onClick={onDecrease}><FaMinus /></IconButton>
      <Quantity>{quantity}</Quantity>
      <IconButton onClick={onIncrease}><FaPlus /></IconButton>
    </QuantityControl>
  </ServiceContainer>
);

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 1.2em;
`;

const ServiceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const ServiceName = styled.span`
  font-weight: bold;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
`;

const Quantity = styled.span`
  margin: 0 10px;
`;

export default ServiceButton;
