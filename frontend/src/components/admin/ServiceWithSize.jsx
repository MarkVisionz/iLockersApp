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
        <IconButton onClick={() => handleDecrease(size)}><FaMinus /></IconButton>
        <Quantity>{quantities[size] || 0}</Quantity>
        <IconButton onClick={() => handleIncrease(size)}><FaPlus /></IconButton>
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

export default ServiceWithSize;

const ServiceContainer = styled.div`
  padding: 15px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
`;

const ServiceTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.2em;
  font-weight: bold;
  text-transform: capitalize;
  color: #333;
`;

const SizeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SizeLabel = styled.label`
  font-size: 1em;
  text-transform: capitalize;
  flex: 1;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1.5;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 1.2em;
  color: #007bff;

  &:hover {
    color: #0056b3;
  }
`;

const Quantity = styled.span`
  margin: 0 10px;
  font-size: 1.2em;
  min-width: 30px;
  text-align: center;
`;


