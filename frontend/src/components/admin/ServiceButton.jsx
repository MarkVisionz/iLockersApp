import React from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceButton = ({ service, quantity, onIncrease, onDecrease }) => (
  <ServiceContainer>
    <ServiceName>{service.charAt(0).toUpperCase() + service.slice(1)}</ServiceName>
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
  padding: 10px;
  font-size: 1.2em;
  color: #007bff;
  transition: color 0.3s ease;

  &:hover {
    color: #0056b3;
  }

  &:active {
    color: #003f7f;
  }
`;

const ServiceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
`;

const ServiceName = styled.span`
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
`;

const Quantity = styled.span`
  margin: 0 15px;
  font-size: 1.2em;
  min-width: 30px;
  text-align: center;
  font-weight: bold;
  color: #333;
`;

export default ServiceButton;
