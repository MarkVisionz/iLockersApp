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

const ServiceContainer = styled.div`
  padding: 20px; /* Aumenté el padding para mayor espacio */
  margin-bottom: 15px; /* Aumenté el margen inferior */
  border: 1px solid #ddd; /* Cambié el color del borde para ser más sutil */
  border-radius: 12px; /* Bordes más redondeados */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Sombra más suave */
  background: linear-gradient(145deg, #f9f9f9, #eaeaea); /* Degradado de fondo */
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px); /* Efecto de elevación al pasar el mouse */
  }
`;

const ServiceTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.5em; /* Aumenté el tamaño de la fuente */
  font-weight: bold;
  text-transform: capitalize;
  color: #333;
`;

const SizeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px; /* Aumenté el margen inferior entre tamaños */
`;

const SizeLabel = styled.label`
  font-size: 1.2em; /* Aumenté el tamaño de la fuente */
  text-transform: capitalize;
  flex: 1;
  color: #555; /* Color más suave para el texto */
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
  font-size: 1.5em; /* Aumenté el tamaño del ícono */
  color: #007bff;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #0056b3;
    transform: scale(1.1); /* Efecto de aumento al pasar el mouse */
  }
 
`;

const Quantity = styled.span`
  margin: 0 15px; font-size: 1.5em; /* Aumenté el tamaño de la fuente */
  min-width: 40px; /* Aumenté el ancho mínimo */
  text-align: center;
  font-weight: bold;
  color: #333;
`;

export default ServiceWithSize; 
