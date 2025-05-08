import React from "react";
import styled from "styled-components";
import { FiDollarSign, FiX } from "react-icons/fi";

const PaymentConfirmationModal = ({ 
  showModal, 
  handleClose, 
  handleConfirm, 
  paymentMethod,
  amount,
  onSelectPaymentMethod
}) => {
  if (!showModal) return null;

  return (
    <ModalOverlay>
      <ModalContent role="dialog" aria-modal="true">
        <CloseButton onClick={handleClose} aria-label="Cerrar modal">
          <FiX size={20} />
        </CloseButton>
        <Title>Confirmar Pago Total</Title>
        <Amount>${amount.toFixed(2)}</Amount>
        
        <PaymentMethodContainer>
          <PaymentMethodButton 
            onClick={onSelectPaymentMethod}
            hasMethod={!!paymentMethod}
            aria-label="Seleccionar método de pago"
          >
            <FiDollarSign size={18} />
            {paymentMethod ? `Método: ${paymentMethod}` : "Seleccionar Método de Pago"}
          </PaymentMethodButton>
        </PaymentMethodContainer>

        <ButtonContainer>
          <ConfirmButton 
            onClick={handleConfirm} 
            disabled={!paymentMethod}
            aria-label="Confirmar pago"
          >
            Confirmar Pago
          </ConfirmButton>
          <CancelButton onClick={handleClose} aria-label="Cancelar">
            Cancelar
          </CancelButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  position: relative;
  background-color: #fff;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: #1e293b;
  animation: bounceIn 0.3s ease-out;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @keyframes bounceIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 90%;
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

  &:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const Amount = styled.p`
  font-size: 2.2rem;
  font-weight: bold;
  color: #28a745;
  margin: 1rem 0;

  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const PaymentMethodContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
`;

const PaymentMethodButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${props => props.hasMethod ? '#28a745' : '#007bff'} 0%, ${props => props.hasMethod ? '#218838' : '#0056b3'} 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    transform: scale(0);
    top: 50%;
    left: 50%;
    pointer-events: none;
  }

  &:active::after {
    animation: ripple 0.6s linear;
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ConfirmButton = styled.button`
  position: relative;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    transform: scale(0);
    top: 50%;
    left: 50%;
    pointer-events: none;
  }

  &:active::after {
    animation: ripple 0.6s linear;
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

const CancelButton = styled.button`
  position: relative;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.3);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    transform: scale(0);
    top: 50%;
    left: 50%;
    pointer-events: none;
  }

  &:active::after {
    animation: ripple 0.6s linear;
  }

  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

export default PaymentConfirmationModal;