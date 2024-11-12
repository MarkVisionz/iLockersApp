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
  padding: 10px;
  font-size: 1.5em; /* Aumenté el tamaño del ícono */
  color: #007bff;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #0056b3;
    transform: scale(1.1); /* Efecto de aumento al pasar el mouse */
  }

  &:active {
    color: #003f7f;
  }
`;

const ServiceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px; /* Aumenté el padding para mayor espacio */
  margin-bottom: 10px; /* Aumenté el margen inferior */
  border: 1px solid #ddd; /* Cambié el color del borde para ser más sutil */
  border-radius: 12px; /* Bordes más redondeados */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); /* Sombra más suave */
  background: linear-gradient(145deg, #f9f9f9, #eaeaea); /* Degradado de fondo */
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px); /* Efecto de elevación al pasar el mouse */
  }
`;

const ServiceName = styled.span`
  font-size: 1.2em; /* Aumenté el tamaño de la fuente */
  font-weight: bold;
  color: #333;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
`;

const Quantity = styled.span`
  margin: 0 15px;
  font-size: 1.5em; /* Aumenté el tamaño de la fuente */
  min-width: 40px; /* Aumenté el ancho mínimo */
  text-align: center;
  font-weight: bold;
  color: #333;
`;

export default ServiceButton;