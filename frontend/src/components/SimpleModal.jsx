import React from "react";
import styled from "styled-components";

const SimpleConfirmationModal = ({ showModal, handleClose, handleConfirm, userName, itemType }) => {
  if (!showModal) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Message>
          {itemType === 'producto' 
            ? `¿Estás seguro de eliminar este producto: ${userName}?` 
            : `¿Estás seguro de eliminar este usuario: ${userName}?`}
        </Message>
        <ButtonContainer>
          <ConfirmButton onClick={handleConfirm}>Confirmar</ConfirmButton>
          <CancelButton onClick={handleClose}>Cancelar</CancelButton>
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: #f9f9f9;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  color: #333;
`;

const Title = styled.h3`
  color: #007bff;
  font-size: 1.4em;
  margin-bottom: 15px;
`;

const Message = styled.p`
  color: #555;
  font-size: 1.1em;
  margin: 8px 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-top: 20px;
`;

const ConfirmButton = styled.button`
  background: #007bff;
  color: white;
  font-size: 1em;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

const CancelButton = styled(ConfirmButton)`
  background: #dc3545;

  &:hover {
    background: #b02a37;
  }
`;

export default SimpleConfirmationModal;