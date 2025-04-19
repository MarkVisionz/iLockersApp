import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceButton = ({ displayName, quantity, onIncrease, onDecrease, onQuantityChange, price }) => {
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());

  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value.replace(/[^0-9]/g, ''));
  };

  const handleInputBlur = () => {
    const numericValue = inputValue === '' ? 0 : parseInt(inputValue, 10);
    const finalValue = Math.max(0, numericValue);
    
    if (onQuantityChange) {
      onQuantityChange(finalValue);
    } else {
      // Fallback para compatibilidad
      const difference = finalValue - quantity;
      if (difference > 0) {
        for (let i = 0; i < difference; i++) onIncrease();
      } else if (difference < 0) {
        for (let i = 0; i < -difference; i++) onDecrease();
      }
    }
    
    setManualInput(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <ServiceContainer>
      <ServiceName>
        {displayName} {price !== undefined ? `($${price})` : ""}
      </ServiceName>
      
      {manualInput ? (
        <QuantityInput
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <>
          <QuantityControl>
            <IconButton onClick={onDecrease} disabled={quantity === 0}>
              <FaMinus />
            </IconButton>
            <Quantity onClick={() => setManualInput(true)}>
              {quantity}
            </Quantity>
            <IconButton onClick={onIncrease}>
              <FaPlus />
            </IconButton>
          </QuantityControl>
        </>
      )}
    </ServiceContainer>
  );
};

// Estilos (se mantienen igual)
const ServiceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const ServiceName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 10px;

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

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4em;
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

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const Quantity = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
  min-width: 30px;
  text-align: center;
  cursor: pointer;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f7ff;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  padding: 0.3em;
  font-size: 1.1rem;
  text-align: center;
  border: 2px solid #007bff;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: #0056b3;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const InputHint = styled.div`
  font-size: 0.7rem;
  color: #666;
  margin-top: 4px;
`;

export default ServiceButton;