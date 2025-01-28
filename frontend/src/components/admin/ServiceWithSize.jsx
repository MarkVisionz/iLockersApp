import React from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceWithSize = ({ service, sizes, selectedSize, quantities, onSelectSize, onQuantityChange }) => {
  const handleDecrease = (size) => {
    const newQuantity = Math.max(quantities[size] - 1, 0);
    onQuantityChange(size, newQuantity);
  };

  const handleIncrease = (size) => {
    const newQuantity = (quantities[size] || 0) + 1;
    onQuantityChange(size, newQuantity);
  };

  const renderSizeControl = (size) => (
    <SizeContainer key={size}>
      <SizeLabel>{size.charAt(0).toUpperCase() + size.slice(1)}</SizeLabel>
      <QuantityControl>
        <IconButton onClick={() => handleDecrease(size)} disabled={quantities[size] === 0}>
          <FaMinus />
        </IconButton>
        <Quantity>{quantities[size] || 0}</Quantity>
        <IconButton onClick={() => handleIncrease(size)}>
          <FaPlus />
        </IconButton>
      </QuantityControl>
    </SizeContainer>
  );

  return (
    <ServiceContainer>
      <ServiceTitle>{service.charAt(0).toUpperCase() + service.slice(1)}</ServiceTitle>
      {sizes.map(renderSizeControl)}
    </ServiceContainer>
  );
};

const SizeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 10px;
  justify-content:space-between;

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const ServiceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f9f9f9;

  @media (max-width: 768px) {
    gap: 8px;
    padding: 8px;
  }
`;

const ServiceTitle = styled.h4`
  margin: 0;
  font-size: 1.2em;

  @media (max-width: 768px) {
    font-size: 1em;
  }
`;

const SizeLabel = styled.span`
  font-size: 1.1em;

  @media (max-width: 768px) {
    font-size: 1em;
  }
`;


const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
`;

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

const Quantity = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

export default ServiceWithSize; 
