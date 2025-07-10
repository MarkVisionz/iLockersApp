import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaPlus, FaMinus } from "react-icons/fa";

const ServiceWithSize = ({ displayName, sizes, quantities, onQuantityChange }) => {
  const [editingSize, setEditingSize] = useState(null);
  const [inputValue, setInputValue] = useState("");

  // Sync inputValue with quantities when editingSize or quantities change
  useEffect(() => {
    if (editingSize) {
      setInputValue((quantities[editingSize]?.quantity || 0).toString());
    }
  }, [quantities, editingSize]);

  const handleDecrease = (size) => {
    const current = quantities[size]?.quantity || 0;
    onQuantityChange(size, Math.max(current - 1, 0));
  };

  const handleIncrease = (size) => {
    const current = quantities[size]?.quantity || 0;
    onQuantityChange(size, current + 1);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value.replace(/[^0-9]/g, ""));
  };

  const handleInputSubmit = (size) => {
    const numericValue = inputValue === "" ? 0 : parseInt(inputValue, 10);
    const finalValue = Math.max(0, numericValue);
    onQuantityChange(size, finalValue);
    setEditingSize(null);
    setInputValue("");
  };

  const startEditing = (size) => {
    setEditingSize(size);
    setInputValue((quantities[size]?.quantity || 0).toString());
  };

  const renderSizeControl = (sizeObj) => {
    const sizeName = sizeObj.name;
    return (
      <SizeContainer key={sizeName}>
        <SizeLabel>
          {sizeName} (${sizeObj.price} {sizeObj.unit || 'pza'})
        </SizeLabel>

        {editingSize === sizeName ? (
          <>
            <QuantityInput
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={() => handleInputSubmit(sizeName)}
              onKeyDown={(e) => e.key === "Enter" && handleInputSubmit(sizeName)}
              autoFocus
            />
            <InputHint>Presiona Enter para guardar</InputHint>
          </>
        ) : (
          <QuantityControl>
            <IconButton
              onClick={() => handleDecrease(sizeName)}
              disabled={(quantities[sizeName]?.quantity || 0) === 0}
            >
              <FaMinus />
            </IconButton>
            <Quantity onClick={() => startEditing(sizeName)}>
              {quantities[sizeName]?.quantity || 0}
            </Quantity>
            <IconButton onClick={() => handleIncrease(sizeName)}>
              <FaPlus />
            </IconButton>
          </QuantityControl>
        )}
      </SizeContainer>
    );
  };

  return (
    <ServiceContainer>
      <ServiceTitle>{displayName}</ServiceTitle>
      {sizes.map(renderSizeControl)}
    </ServiceContainer>
  );
};

// Estilos
const ServiceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    gap: 10px;
    padding: 10px;
  }
`;

const ServiceTitle = styled.h4`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    font-size: 1.1em;
  }
`;

const SizeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background-color: #f9f9f9;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

const SizeLabel = styled.span`
  font-size: 1.1em;
  font-weight: 500;
  color: #444;
  text-align: center;

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
  padding: 0.4em;
  font-size: 1.2em;
  color: #007bff;
  transition: color 0.3s ease, transform 0.2s ease;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #0056b3;
    transform: scale(1.1);
    background-color: #f0f7ff;
  }

  &:active {
    color: #003f7f;
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    transform: none;
    background-color: transparent;
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
  user-select: none;

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
  font-weight: bold;

  &:focus {
    border-color: #0056b3;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const InputHint = styled.div`
  font-size: 0.7rem;
  color: #666;
  margin-top: 4px;
  text-align: center;
`;

export default ServiceWithSize;