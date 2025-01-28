import React from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceButton = ({ service, quantity, onIncrease, onDecrease }) => {
  const capitalizeServiceName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <ServiceContainer>
      <ServiceName>{capitalizeServiceName(service)}</ServiceName>
      <QuantityControl>
        <IconButton onClick={onDecrease} disabled={quantity === 0}>
          <FaMinus />
        </IconButton>
        <Quantity>{quantity}</Quantity>
        <IconButton onClick={onIncrease}>
          <FaPlus />
        </IconButton>
      </QuantityControl>
    </ServiceContainer>
  );
};

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.3em; /* Cambié a em para ser más responsivo */
  font-size: 1.2em;
  color: #007bff;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #0056b3;
    transform: scale(1.1);
  }

  &:active {
    color: #003f7f;
  }
`;

const ServiceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const ServiceName = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
`;

const Quantity = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;


export default ServiceButton;