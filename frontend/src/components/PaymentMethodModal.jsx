import React from 'react';
import styled from 'styled-components';
import { FiDollarSign, FiCreditCard, FiSend, FiX } from "react-icons/fi";

const PaymentMethodModal = ({ isOpen, onClose, onSelect, onCancel, title, paymentMethods = [] }) => {
  if (!isOpen) return null;

  const defaultPaymentMethods = [
    { id: "efectivo", label: "Efectivo", icon: <FiDollarSign size={18} />, color: "#28a745" },
    { id: "tarjeta", label: "Tarjeta", icon: <FiCreditCard size={18} />, color: "#007bff" },
    { id: "transferencia", label: "Transferencia", icon: <FiSend size={18} />, color: "#4b70e2" }
  ];

  const methodsToShow = paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods;

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose} aria-label="Cerrar modal">
          <FiX size={20} />
        </CloseButton>
        <ModalTitle>{title}</ModalTitle>
        <ModalButtons>
          {methodsToShow.map(method => (
            <ModalButton 
              key={method.id}
              onClick={() => onSelect(method.id)} 
              color={method.color}
              aria-label={`Seleccionar ${method.label}`}
            >
              {method.icon}
              {method.label}
            </ModalButton>
          ))}
        </ModalButtons>
        <CancelButton onClick={onCancel}>Cancelar</CancelButton>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  position: relative;
  background-color: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #1e293b;
  }
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
`;

const ModalButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, ${(props) => props.color} 0%, ${(props) => darken(props.color, 0.2)} 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem;
  background-color: #dc3545;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #c82333;
    transform: scale(1.05);
  }
`;

const darken = (color, amount) => {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export default PaymentMethodModal;